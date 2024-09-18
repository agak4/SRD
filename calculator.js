let combinationData = {};
const STATES = ["기초+0", "기초+1", "기초+2", "특별+0", "특별+1", "특별+2", "정예+0", "정예+1", "정예+2", "전설+0"];
const ALL_UNITS = ["칸나", "유니", "히나", "시로", "타비", "리제", "부키", "린", "나나", "리코"];

// CSV 파일 파싱 및 데이터 로드
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

// UI 초기화
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

// 결과 테이블 초기화
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

// 토글 버튼 생성
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

// 타겟 상태 버튼 업데이트
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

// 모든 타겟 상태 비활성화
function disableAllTargetStates() {
    document.querySelectorAll('.toggle-btn[data-group="targetState"]').forEach(btn => {
        btn.classList.add('disabled');
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.5';
    });
}

// 선택된 값 가져오기
function getSelectedValue(group) {
    const activeButton = document.querySelector(`.toggle-btn[data-group="${group}"].active`);
    return activeButton ? activeButton.textContent : null;
}

// 재료 계산 및 표시 (수정됨)
function calculateAndDisplay() {
    const unit = getSelectedValue('unit');
    const currentState = getSelectedValue('currentState');
    const targetState = getSelectedValue('targetState');

    if (!unit || !currentState || !targetState) {
        clearResultTable();
        return;
    }

    const materials = calculateMaterials(unit, currentState, targetState);
    displayResults(materials);
}

// 재료 계산 (재귀 함수)
function calculateMaterials(unit, currentState, targetState, memo = {}) {
    const key = `${unit},${currentState},${targetState}`;
    if (memo[key]) return memo[key];
    if (currentState === targetState) return {};

    const result = {};
    let state = currentState;

    while (state !== targetState) {
        const nextState = getNextState(state);
        if (!nextState) break;

        const comboKey = `${state},${nextState}`;
        const [material, materialState] = combinationData[unit][comboKey];

        const subMaterials = calculateMaterials(material, '기초+0', materialState, memo);
        for (const [subMaterial, count] of Object.entries(subMaterials)) {
            result[subMaterial] = (result[subMaterial] || 0) + count;
        }

        result[material] = (result[material] || 0) + 1;

        state = nextState;
    }

    memo[key] = result;
    return result;
}

// 다음 상태 가져오기
function getNextState(state) {
    const index = STATES.indexOf(state);
    return index < STATES.length - 1 ? STATES[index + 1] : null;
}

// 결과 표시
function displayResults(materials) {
    const table = document.querySelector('.result-table');
    const countRow = table.rows[1];

    ALL_UNITS.forEach((unitName, index) => {
        countRow.cells[index].textContent = materials[unitName] || '0';
    });
}

// 결과 테이블 초기화
function clearResultTable() {
    const table = document.querySelector('.result-table');
    const countRow = table.rows[1];
    ALL_UNITS.forEach((_, index) => {
        countRow.cells[index].textContent = '0';
    });
}
