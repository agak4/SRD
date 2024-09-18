let combinationData = {};
const STATES = ["기초+0", "기초+1", "기초+2", "특별+0", "특별+1", "특별+2", "정예+0", "정예+1", "정예+2", "전설+0"];
const ALL_UNITS = ["칸나", "유니", "히나", "시로", "타비", "리제", "부키", "린", "나나", "리코"];

Papa.parse("combination_data.csv", {
    download: true,
    header: true,
    complete: function(results) {
        combinationData = results.data.reduce((acc, row) => {
            const unit = row['유닛'];
            const key = `${row['현재 상태']},${row['목표 상태']}`;
            if (!acc[unit]) acc[unit] = {};
            acc[unit][key] = [row['필요 재료'], row['재료 상태']];
            return acc;
        }, {});
        initUI();
        initResultTable();
    }
});

function initUI() {
    const unitButtons = document.getElementById('unitButtons');
    const currentStateButtons = document.getElementById('currentStateButtons');
    const targetStateButtons = document.getElementById('targetStateButtons');

    ALL_UNITS.forEach(unit => {
        const button = createToggleButton(unit, 'unit');
        unitButtons.appendChild(button);
    });

    STATES.forEach((state, index) => {
        if (index < STATES.length - 1) {
            const button = createToggleButton(state, 'currentState');
            currentStateButtons.appendChild(button);
        }
        if (index > 0) {
            const button = createToggleButton(state, 'targetState');
            targetStateButtons.appendChild(button);
        }
    });

    disableAllTargetStates();
}

function initResultTable() {
    const resultDiv = document.getElementById('result');
    const table = document.createElement('table');
    table.className = 'result-table';

    const headerRow = table.insertRow();
    ALL_UNITS.forEach(unit => {
        const th = document.createElement('th');
        th.textContent = unit;
        headerRow.appendChild(th);
    });

    const countRow = table.insertRow();
    ALL_UNITS.forEach(() => {
        const td = countRow.insertCell();
        td.textContent = '0';
    });

    resultDiv.appendChild(table);
}

function createToggleButton(text, group) {
    const button = document.createElement('div');
    button.textContent = text;
    button.className = 'toggle-btn';
    button.onclick = function() {
        if (this.classList.contains('disabled')) return;
        document.querySelectorAll(`.toggle-btn[data-group="${group}"]`).forEach(btn => {
            btn.classList.remove('active');
        });
        this.classList.add('active');
        if (group === 'currentState') {
            updateTargetStateButtons();
            calculateAndDisplay();
        } else if (group === 'targetState' || group === 'unit') {
            calculateAndDisplay();
        }
    };
    button.setAttribute('data-group', group);
    if (group === 'unit') {
        button.setAttribute('data-unit', text);
    }
    return button;
}

function updateTargetStateButtons() {
    const currentState = getSelectedValue('currentState');
    const currentStateIndex = STATES.indexOf(currentState);

    document.querySelectorAll('.toggle-btn[data-group="targetState"]').forEach((btn, index) => {
        if (index + 1 > currentStateIndex) {
            btn.classList.remove('disabled');
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
        } else {
            btn.classList.remove('active');
            btn.classList.add('disabled');
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.5';
        }
    });
}

function disableAllTargetStates() {
    document.querySelectorAll('.toggle-btn[data-group="targetState"]').forEach(btn => {
        btn.classList.add('disabled');
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.5';
    });
}

function getSelectedValue(group) {
    const activeButton = document.querySelector(`.toggle-btn[data-group="${group}"].active`);
    return activeButton ? activeButton.textContent : null;
}

function calculateAndDisplay() {
    const unit = getSelectedValue('unit');
    const currentState = getSelectedValue('currentState');
    const targetState = getSelectedValue('targetState');

    if (!unit || !currentState || !targetState) {
        clearResultTable();
        return;
    }

    const materials = calculateBaseMaterials(unit, currentState, targetState);
    displayResults(unit, currentState, targetState, materials);
}

function displayResults(unit, currentState, targetState, materials) {
    const table = document.querySelector('.result-table');
    const countRow = table.rows[1];

    ALL_UNITS.forEach((unitName, index) => {
        countRow.cells[index].textContent = materials[unitName] || '0';
    });

    const description = document.createElement('p');
    description.id = 'result-description';
    description.textContent = `${unit}을(를) ${currentState}에서 ${targetState}로 강화하는데 필요한 기초+0 재료 수입니다.`;
    
    const resultDiv = document.getElementById('result');
    const existingDescription = document.getElementById('result-description');
    if (existingDescription) {
        resultDiv.replaceChild(description, existingDescription);
    } else {
        resultDiv.appendChild(description);
    }
}

function clearResultTable() {
    const table = document.querySelector('.result-table');
    const countRow = table.rows[1];
    ALL_UNITS.forEach((_, index) => {
        countRow.cells[index].textContent = '0';
    });
    const description = document.getElementById('result-description');
    if (description) description.remove();
}

function calculateBaseMaterials(unit, currentState, targetState) {
    const result = {};

    if (currentState === targetState) {
        return result;
    }

    while (currentState !== targetState) {
        const nextState = getNextState(currentState);
        if (!nextState) break;

        const key = `${currentState},${nextState}`;
        const materialInfo = combinationData[unit][key];

        if (!materialInfo) break;

        const [material, materialState] = materialInfo;

        if (materialState === '기초+0') {
            result[material] = (result[material] || 0) + 1;
        } else {
            const subMaterials = calculateBaseMaterials(material, '기초+0', materialState);
            for (const [subMaterial, count] of Object.entries(subMaterials)) {
                result[subMaterial] = (result[subMaterial] || 0) + count;
            }
        }

        currentState = nextState;
    }

    return result;
}

function getNextState(state) {
    const index = STATES.indexOf(state);
    return index < STATES.length - 1 ? STATES[index + 1] : null;
}
