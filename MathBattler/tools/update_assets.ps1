# update_assets.ps1
# js/data/monster_list.js, js/data/equipment_list.js, js/data/item_list.js を自動生成

$BaseDir = Split-Path $PSScriptRoot -Parent
$AssetsDir = Join-Path $BaseDir "assets"
$DataDir = Join-Path (Join-Path $BaseDir "js") "data"
$ImageDir = Join-Path $AssetsDir "image"

# --- monster_list.js ---
# 新フォルダ構成:
# assets/image/monster/Boss/  Heal/  Normal/  Rare/  Special/  SuperRare/
$MonsterImageDir = Join-Path $ImageDir "monster"
$Categories = @("Boss", "Heal", "Normal", "Rare", "Special", "SuperRare")

$MonsterListLines = @()
$MonsterListLines += "window.MONSTER_ASSETS = {"
foreach ($cat in $Categories) {
    $catDir = Join-Path $MonsterImageDir $cat
    if (Test-Path $catDir) {
        if ($cat -eq "Normal") {
            # Normal はサブフォルダ（01〜10）構成: ファイル名のみ収集（パスなし）
            $files = Get-ChildItem -Path $catDir -Recurse -File |
                Where-Object { $_.Extension -match "\.(webp|png|jpg|jpeg)$" } |
                Sort-Object Name |
                ForEach-Object { $_.Name }
        } else {
            $files = Get-ChildItem -Path $catDir -File | Where-Object { $_.Extension -match "\.(webp|png|jpg|jpeg)$" } | Sort-Object Name | ForEach-Object { $_.Name }
        }
    } else {
        $files = @()
    }
    $fileList = ($files | ForEach-Object { "    `"$_`"" }) -join ",`n"
    if ($files.Count -gt 0) {
        $MonsterListLines += "    ${cat}: [`n$fileList`n    ],"
    } else {
        $MonsterListLines += "    ${cat}: [],"
    }
}
# Remove trailing comma from last element
$last = $MonsterListLines[-1]
$MonsterListLines[-1] = $last.TrimEnd(",")
$MonsterListLines += "};"

$MonsterListPath = Join-Path $DataDir "monster_list.js"
$MonsterListLines | Set-Content -Path $MonsterListPath -Encoding UTF8
Write-Host "Generated: $MonsterListPath"

# --- equipment_list.js ---
$EquipDir = Join-Path $ImageDir "equipment"
$EquipListPath = Join-Path $DataDir "equipment_list.js"

# 既存ファイルから手動設定値を読み込んで保持する
$existingEquip = @{}
if (Test-Path $EquipListPath) {
    $existingContent = Get-Content -Path $EquipListPath -Raw -Encoding UTF8
    # 各エントリブロックを抽出
    $blockMatches = [regex]::Matches($existingContent, '\{[^{}]+\}')
    foreach ($bm in $blockMatches) {
        $block = $bm.Value
        $idM = [regex]::Match($block, 'id:\s*"([^"]+)"')
        if (-not $idM.Success) { continue }
        $eid = $idM.Groups[1].Value
        $saved = @{}
        foreach ($field in @('attack', 'defense', 'sellPrice', 'bonus')) {
            $fm = [regex]::Match($block, "${field}:\s*(-?\d+(?:\.\d+)?)")
            if ($fm.Success) { $saved[$field] = $fm.Groups[1].Value }
        }
        $fm2 = [regex]::Match($block, 'specialEffectId:\s*([^,}\r\n]+)')
        if ($fm2.Success) { $saved['specialEffectId'] = $fm2.Groups[1].Value.Trim() }
        $existingEquip[$eid] = $saved
    }
}

$EquipLines = @()
$EquipLines += "window.EQUIPMENT_LIST = ["

foreach ($type in @("sword", "shield")) {
    $typeDir = Join-Path $EquipDir $type
    if (Test-Path $typeDir) {
        $files = Get-ChildItem -Path $typeDir -File | Where-Object { $_.Extension -match "\.(webp|png|jpg|jpeg)$" } | Sort-Object Name
    } else {
        $files = @()
    }
    foreach ($file in $files) {
        $fname = $file.Name
        $id = [System.IO.Path]::GetFileNameWithoutExtension($fname)
        # Extract minFloor from prefix like D001
        if ($id -match "^[A-Za-z]*(\d+)_") {
            $minFloor = [int]$Matches[1]
        } else {
            $minFloor = 1
        }
        # Extract name (after first underscore)
        if ($id -match "^[^_]+_(.+)$") {
            $name = $Matches[1]
        } else {
            $name = $id
        }
        # 既存の手動設定値を優先、なければデフォルト値
        $prev = if ($existingEquip.ContainsKey($id)) { $existingEquip[$id] } else { @{} }
        $attack         = if ($prev.ContainsKey('attack'))         { $prev['attack'] }         else { '0' }
        $defense        = if ($prev.ContainsKey('defense'))        { $prev['defense'] }        else { '0' }
        $sellPrice      = if ($prev.ContainsKey('sellPrice'))      { $prev['sellPrice'] }      else { '0' }
        $specialEffectId = if ($prev.ContainsKey('specialEffectId')) { $prev['specialEffectId'] } else { 'null' }

        $EquipLines += "    {"
        $EquipLines += "        id: `"$id`","
        $EquipLines += "        name: `"$name`","
        $EquipLines += "        type: `"$type`","
        $EquipLines += "        minFloor: $minFloor,"
        $EquipLines += "        attack: $attack,"
        $EquipLines += "        defense: $defense,"
        # bonusフィールドが既存ファイルに存在する場合のみ出力
        if ($prev.ContainsKey('bonus')) {
            $bonus = $prev['bonus']
            $EquipLines += "        bonus: $bonus,"
        }
        $EquipLines += "        specialEffectId: $specialEffectId,"
        $EquipLines += "        img: `"$fname`","
        $EquipLines += "        sellPrice: $sellPrice,"
        $EquipLines += "    },"
    }
}
# Remove trailing comma from last entry
if ($EquipLines[-1] -eq "    },") {
    $EquipLines[-1] = "    }"
}
$EquipLines += "];"

$EquipLines | Set-Content -Path $EquipListPath -Encoding UTF8
Write-Host "Generated: $EquipListPath"

# --- item_list.js ---
# id = ファイル名のステム（拡張子なし）
# 既存エントリの並び順を保持し、新ファイルは末尾に追加する
$ItemDir = Join-Path $ImageDir "item"
$ItemListPath = Join-Path $DataDir "item_list.js"

# 既存ファイルから順序付きID一覧とメタデータを読み込む
$existingItems = [ordered]@{}
if (Test-Path $ItemListPath) {
    $existingItemContent = Get-Content -Path $ItemListPath -Raw -Encoding UTF8
    $itemBlockMatches = [regex]::Matches($existingItemContent, '\{[^{}]+\}')
    foreach ($bm in $itemBlockMatches) {
        $block = $bm.Value
        $idM = [regex]::Match($block, 'id:\s*"([^"]+)"')
        if (-not $idM.Success) { continue }
        $iid = $idM.Groups[1].Value
        $saved = @{}
        $nm = [regex]::Match($block, 'name:\s*"([^"]*)"')
        if ($nm.Success) { $saved['name'] = $nm.Groups[1].Value }
        $sp = [regex]::Match($block, 'sellPrice:\s*(\d+)')
        if ($sp.Success) { $saved['sellPrice'] = $sp.Groups[1].Value }
        $dm = [regex]::Match($block, 'desc:\s*"([^"]*)"')
        if ($dm.Success) { $saved['desc'] = $dm.Groups[1].Value }
        $rum = [regex]::Match($block, "requiresUnlock:\s*'([^']*)'")
        if ($rum.Success) { $saved['requiresUnlock'] = $rum.Groups[1].Value }
        $imgM = [regex]::Match($block, 'img:\s*"([^"]*)"')
        if ($imgM.Success) { $saved['img'] = $imgM.Groups[1].Value }
        $existingItems[$iid] = $saved
    }
}

# フォルダから現在のファイル一覧を取得（id = ファイル名ステム）
$folderIds = @{}
if (Test-Path $ItemDir) {
    Get-ChildItem -Path $ItemDir -File | Where-Object { $_.Extension -match "\.(webp|png|jpg|jpeg)$" } | ForEach-Object {
        $fid = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
        $folderIds[$fid] = $_.Name
    }
}

# 出力順: 既存の順 → フォルダにあるが未登録のものを末尾に追加
$outputOrder = [System.Collections.Generic.List[string]]::new()
foreach ($iid in $existingItems.Keys) {
    if ($folderIds.ContainsKey($iid)) { $outputOrder.Add($iid) }
}
foreach ($fid in ($folderIds.Keys | Sort-Object)) {
    if (-not $existingItems.Contains($fid)) { $outputOrder.Add($fid) }
}

$ItemLines = @()
$ItemLines += "window.ITEM_LIST = ["

foreach ($id in $outputOrder) {
    $fname = if ($existingItems.Contains($id) -and $existingItems[$id].ContainsKey('img')) { $existingItems[$id]['img'] } else { $folderIds[$id] }
    $prev = if ($existingItems.Contains($id)) { $existingItems[$id] } else { @{} }
    $name      = if ($prev.ContainsKey('name'))      { $prev['name'] }      else { $id }
    $sellPrice = if ($prev.ContainsKey('sellPrice')) { $prev['sellPrice'] } else { '0' }
    $desc      = if ($prev.ContainsKey('desc'))      { $prev['desc'] }      else { '' }
    $ItemLines += "    {"
    $ItemLines += "        id: `"$id`","
    $ItemLines += "        name: `"$name`","
    $ItemLines += "        sellPrice: $sellPrice,"
    $ItemLines += "        desc: `"$desc`","
    $ItemLines += "        img: `"$fname`","
    $ItemLines += "        effectId: null,"
    if ($prev.ContainsKey('requiresUnlock')) {
        $ru = $prev['requiresUnlock']
        $ItemLines += "        requiresUnlock: '$ru',"
    }
    $ItemLines += "    },"
}
if ($ItemLines[-1] -eq "    },") {
    $ItemLines[-1] = "    }"
}
$ItemLines += "];"

$ItemLines | Set-Content -Path $ItemListPath -Encoding UTF8
Write-Host "Generated: $ItemListPath"

Write-Host "Done! All asset lists generated."
