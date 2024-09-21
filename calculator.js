let combinationData = [];
let units = [];
const levels = ['기초+0', '기초+1', '기초+2', '특별+0', '특별+1', '특별+2', '정예+0', '정예+1', '정예+2', '전설+0'];

let selectedUnit = '';
let currentLevel = '';
let targetLevel = '';

let ownedUnits = {};

document.addEventListener('DOMContentLoaded', loadCSV);

function loadCSV() {
    Papa.parse("./combination_data.csv", {
        download: true,
        complete: function(results) {
            console.log(results.data);
            processData(results.data);
        }
    });
}

function processData(data) {
    combinationData = data.slice(1).map(row => {
        return {
            유닛: row[0],
            현재상태: row[1],
            목표상태: row[2],
            필요재료: row[3],
            재료상태: row[4]
        };
    });

    units = [...new Set(combinationData.map(item => item.유닛))];

    initializeCalculator();
}

function initializeCalculator() {
    const unitButtons = document.getElementById('unit-buttons');
    units.forEach(unit => {
        const button = document.createElement('button');
        button.textContent = unit;
        button.setAttribute('data-unit', unit);
        button.onclick = () => selectUnit(unit);
        unitButtons.appendChild(button);
    });

    const currentLevelDiv = document.getElementById('current-level');
    levels.slice(0, -1).forEach(level => {
        const button = document.createElement('button');
        button.textContent = level;
        button.setAttribute('data-level', level);
        button.onclick = () => selectCurrentLevel(level);
        button.disabled = true;
        currentLevelDiv.appendChild(button);
    });

    const targetLevelDiv = document.getElementById('target-level');
    levels.slice(1).forEach(level => {
        const button = document.createElement('button');
        button.textContent = level;
        button.setAttribute('data-level', level);
        button.onclick = () => selectTargetLevel(level);
        button.disabled = true;
        targetLevelDiv.appendChild(button);
    });

    calculateMaterials();
}

function selectUnit(unit) {
    selectedUnit = unit;
    document.querySelectorAll('#unit-buttons button').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === unit);
    });
    ownedUnits = {};

    document.querySelectorAll('#current-level button').forEach(btn => {
        btn.disabled = false;
    });

    document.querySelectorAll('#target-level button').forEach(btn => {
        btn.disabled = false;
    });

    const currentLevelIndex = levels.indexOf(currentLevel);
    document.querySelectorAll('#target-level button').forEach(btn => {
        const btnLevel = btn.getAttribute('data-level');
        const btnLevelIndex = levels.indexOf(btnLevel);
        btn.disabled = btnLevelIndex <= currentLevelIndex;
    });
    
    checkCalculation();
}

function selectCurrentLevel(level) {
    currentLevel = level;
    document.querySelectorAll('#current-level button').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === level);
    });
    ownedUnits = {};

    const currentLevelIndex = levels.indexOf(level);
    document.querySelectorAll('#target-level button').forEach(btn => {
        const btnLevel = btn.getAttribute('data-level');
        const btnLevelIndex = levels.indexOf(btnLevel);
        btn.disabled = btnLevelIndex <= currentLevelIndex;
    });

    checkCalculation();
}

function selectTargetLevel(level) {
    targetLevel = level;
    document.querySelectorAll('#target-level button').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === level);
    });
    ownedUnits = {};
    checkCalculation();
}

function checkCalculation() {
    if (selectedUnit && currentLevel && targetLevel) {
        calculateMaterials();
    }
}

function calculateMaterials() {
    let materials = [];
    let currentIndex = levels.indexOf(currentLevel);
    let targetIndex = levels.indexOf(targetLevel);

    while (currentIndex < targetIndex) {
        const currentState = levels[currentIndex];
        const nextState = levels[currentIndex + 1];
        const recipe = combinationData.find(d =>
            d.유닛 === selectedUnit &&
            d.현재상태 === currentState &&
            d.목표상태 === nextState
        );

        if (recipe) {
            materials.push({
                unit: recipe.필요재료,
                level: recipe.재료상태
            });
        }

        currentIndex++;
    }

    let decomposedMaterialsToElite = materials.reduce((acc, material) => {
        const decomposed = decomposeMaterialToElite(material.unit, material.level);
        for (let unit in decomposed) {
            const level = decomposed[unit].level;
            if (!acc[level]) {
                acc[level] = {};
            }
            if (!acc[level][unit]) {
                acc[level][unit] = { count: 0, level: level };
            }
            acc[level][unit].count += decomposed[unit].count;
        }
        return acc;
    }, {});


    // 보유 중인 유닛 제거
    for (let unit in ownedUnits) {
        let ownedCount = ownedUnits[unit];

        if (decomposedMaterialsToElite['정예+0'] && decomposedMaterialsToElite['정예+0'][unit]) {
            if (decomposedMaterialsToElite['정예+0'][unit].count > 0) {
                let diff = Math.min(ownedCount, decomposedMaterialsToElite['정예+0'][unit].count);
                decomposedMaterialsToElite['정예+0'][unit].count += diff;
                ownedCount -= diff;
            }
        } else {
        }
    }
    let convertMaterials = convertDecomposedToMaterials(decomposedMaterialsToElite);

    let decomposedMaterialsToSpecial = convertMaterials.reduce((acc, material) => {
        const decomposed = decomposeMaterialToSpecial(material.unit, material.level);
        for (let unit in decomposed) {
            const level = decomposed[unit].level;
            if (!acc[level]) {
                acc[level] = {};
            }
            if (!acc[level][unit]) {
                acc[level][unit] = { count: 0, level: level };
            }
            acc[level][unit].count += decomposed[unit].count;
        }
        return acc;
    }, {});

    let decomposedMaterialsToBasic = convertMaterials.reduce((acc, material) => {
        const decomposed = decomposeMaterialToBasic(material.unit, material.level);
        for (let unit in decomposed) {
            const level = decomposed[unit].level;
            if (!acc[level]) {
                acc[level] = {};
            }
            if (!acc[level][unit]) {
                acc[level][unit] = { count: 0, level: level };
            }
            acc[level][unit].count += decomposed[unit].count;
        }
        return acc;
    }, {});

    let results = {
        elite: {
            '정예+0': {},
            '특별+0': {},
            '기초+0': {}
        },
        special: {
            '특별+0': {},
            '기초+0': {}
        },
        basic: {
            '기초+0': {}
        },
    };

    for (let level in decomposedMaterialsToElite) {
        for (let unit in decomposedMaterialsToElite[level]) {
            let count = decomposedMaterialsToElite[level][unit].count;

            if (level.startsWith('정예')) {
                results.elite['정예+0'][unit] = (results.elite['정예+0'][unit] || 0) + count;
            } else if (level.startsWith('특별')) {
                results.elite['특별+0'][unit] = (results.elite['특별+0'][unit] || 0) + count;
            } else {
                results.elite['기초+0'][unit] = (results.elite['기초+0'][unit] || 0) + count;
            }
        }
    }

    for (let level in decomposedMaterialsToSpecial) {
        for (let unit in decomposedMaterialsToSpecial[level]) {
            let count = decomposedMaterialsToSpecial[level][unit].count;

            if (level.startsWith('특별')) {
                results.special['특별+0'][unit] = (results.special['특별+0'][unit] || 0) + count;
            } else {
                results.special['기초+0'][unit] = (results.special['기초+0'][unit] || 0) + count;
            }
        }
    }

    for (let level in decomposedMaterialsToBasic) {
        for (let unit in decomposedMaterialsToBasic[level]) {
            let count = decomposedMaterialsToBasic[level][unit].count;

            results.basic['기초+0'][unit] = (results.basic['기초+0'][unit] || 0) + count;
        }
    }

    displayResult(results);
}

function convertDecomposedToMaterials(decomposedMaterials) {
    let materials = [];
    for (let level in decomposedMaterials) {
        for (let unit in decomposedMaterials[level]) {
            const count = decomposedMaterials[level][unit].count;
            for (let i = 0; i < count; i++) {
                materials.push({
                    unit: unit,
                    level: level
                });
            }
        }
    }
    return materials;
}

function getLevelIndex(level) {
    return levels.indexOf(level);
}

function isLevelHigherOrEqual(level, targetLevel) {
    return getLevelIndex(level) >= getLevelIndex(targetLevel);
}

function decomposeMaterialToElite(unit, level) {
    let result = {};

    if (level === '정예+0' || level === '특별+0' || level === '기초+0') {
        result[unit] = { count: 1, level: level };
        return result;
    }

    const recipe = combinationData.find(d =>
        d.유닛 === unit &&
        d.목표상태 === level
    );

    if (recipe) {
        // 현재 유닛을 한 단계 낮은 레벨로 분해
        const lowerLevelMaterials = decomposeMaterialToElite(unit, recipe.현재상태);
        Object.assign(result, lowerLevelMaterials);

        // 필요한 재료도 분해
        const subMaterials = decomposeMaterialToElite(recipe.필요재료, recipe.재료상태);

        // 결과 병합
        for (let subUnit in subMaterials) {
            if (result[subUnit]) {
                result[subUnit].count += subMaterials[subUnit].count;
            } else {
                result[subUnit] = { ...subMaterials[subUnit] };
            }
        }
    }

    return result;
}

function decomposeMaterialToSpecial(unit, level) {
    let result = {};

    if (level === '특별+0' || level === '기초+0') {
        result[unit] = { count: 1, level: level };
        return result;
    }

    const recipe = combinationData.find(d =>
        d.유닛 === unit &&
        d.목표상태 === level
    );

    if (recipe) {
        // 현재 유닛을 한 단계 낮은 레벨로 분해
        const lowerLevelMaterials = decomposeMaterialToSpecial(unit, recipe.현재상태);
        Object.assign(result, lowerLevelMaterials);

        // 필요한 재료도 분해
        const subMaterials = decomposeMaterialToSpecial(recipe.필요재료, recipe.재료상태);

        // 결과 병합
        for (let subUnit in subMaterials) {
            if (result[subUnit]) {
                result[subUnit].count += subMaterials[subUnit].count;
            } else {
                result[subUnit] = { ...subMaterials[subUnit] };
            }
        }
    }

    return result;
}

function decomposeMaterialToBasic(unit, level) {
    let result = {};

    if (level === '기초+0') {
        result[unit] = { count: 1, level: level };
        return result;
    }

    const recipe = combinationData.find(d =>
        d.유닛 === unit &&
        d.목표상태 === level
    );

    if (recipe) {
        // 현재 유닛을 한 단계 낮은 레벨로 분해
        const lowerLevelMaterials = decomposeMaterialToBasic(unit, recipe.현재상태);
        Object.assign(result, lowerLevelMaterials);

        // 필요한 재료도 분해
        const subMaterials = decomposeMaterialToBasic(recipe.필요재료, recipe.재료상태);

        // 결과 병합
        for (let subUnit in subMaterials) {
            if (result[subUnit]) {
                result[subUnit].count += subMaterials[subUnit].count;
            } else {
                result[subUnit] = { ...subMaterials[subUnit] };
            }
        }
    }

    return result;
}

function displayResult(results) {
    displayEliteResult(results.elite);
    displaySpecialResult(results.special);
    displayBasicResult(results.basic);
}

function displayEliteResult(eliteResults) {
    const resultGrid = document.querySelector('#elite-result .result-grid');
    const rows = ['정예+0', '특별+0', '기초+0'];
    displayResultGrid(resultGrid, eliteResults, rows);
}

function displaySpecialResult(specialResults) {
    const resultGrid = document.querySelector('#special-result .result-grid');
    const rows = ['특별+0', '기초+0'];
    displayResultGrid(resultGrid, specialResults, rows);
}

function displayBasicResult(basicResults) {
    const resultGrid = document.querySelector('#basic-result .result-grid');
    const rows = ['기초+0'];
    displayResultGrid(resultGrid, basicResults, rows);
}

function displayResultGrid(grid, results, rows) {
    grid.innerHTML = '';
    rows.forEach(row => {
        units.forEach(unit => {
            const item = document.createElement('div');
            item.className = 'result-item';
            const img = document.createElement('img');
            img.src = `images/${unit}_${row}.png`;
            item.appendChild(img);

            const count = results[row][unit] || 0;
            const span = document.createElement('span');
            span.textContent = count > 0 ? count : '-';
            span.className = 'material-count';
            item.appendChild(span);

            if (row === '정예+0') {
                const controls = document.createElement('div');
                controls.className = 'unit-controls';
                const minusBtn = createControlButton('-', () => adjustOwnedUnits(unit, -1));
                const plusBtn = createControlButton('+', () => adjustOwnedUnits(unit, +1));
                controls.appendChild(minusBtn);
                controls.appendChild(plusBtn);
                item.appendChild(controls);
            }

            grid.appendChild(item);
        });
    });
}

function createControlButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = 'unit-control-btn';
    btn.onclick = onClick;
    return btn;
}

function adjustOwnedUnits(unit, change) {
    ownedUnits[unit] = (ownedUnits[unit] || 0) + change;
    calculateMaterials();
}
