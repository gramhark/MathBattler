# update_assets.ps1
# assets/monster_list.js, assets/equipment_list.js, assets/item_list.js を自動生成

$BaseDir = Split-Path $PSScriptRoot -Parent
$AssetsDir = Join-Path $BaseDir "assets"
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

$MonsterListPath = Join-Path $AssetsDir "monster_list.js"
$MonsterListLines | Set-Content -Path $MonsterListPath -Encoding UTF8
Write-Host "Generated: $MonsterListPath"

# --- equipment_list.js ---
$EquipDir = Join-Path $ImageDir "equipment"
$EquipListPath = Join-Path $AssetsDir "equipment_list.js"

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
$ItemDir = Join-Path $ImageDir "item"
$ItemListPath = Join-Path $AssetsDir "item_list.js"

# 既存ファイルから手動設定値を読み込んで保持する
$existingItems = @{}
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
        $existingItems[$iid] = $saved
    }
}

$ItemLines = @()
$ItemLines += "window.ITEM_LIST = ["

if (Test-Path $ItemDir) {
    $itemFiles = Get-ChildItem -Path $ItemDir -File | Where-Object { $_.Extension -match "\.(webp|png|jpg|jpeg)$" } | Sort-Object Name
} else {
    $itemFiles = @()
}
foreach ($file in $itemFiles) {
    $fname = $file.Name
    $id = [System.IO.Path]::GetFileNameWithoutExtension($fname)
    $prev = if ($existingItems.ContainsKey($id)) { $existingItems[$id] } else { @{} }
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
    $ItemLines += "    },"
}
if ($ItemLines[-1] -eq "    },") {
    $ItemLines[-1] = "    }"
}
$ItemLines += "];"

$ItemLines | Set-Content -Path $ItemListPath -Encoding UTF8
Write-Host "Generated: $ItemListPath"

Write-Host "Done! All asset lists generated."
