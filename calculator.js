let combinationData = {};
const STATES = ["기초+0", "기초+1", "기초+2", "특별+0", "특별+1", "특별+2", "정예+0", "정예+1", "정예+2", "전설+0"];

// CSV 파일 로드
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

        // UI 초기화
        initUI();
    }
});

function initUI() {
    const unitButtons = document.getElementById('unitButtons');
    const currentStateButtons = document.getElementById('currentStateButtons');
    const targetStateButtons = document.getElementById('targetStateButtons');

    // 유닛 버튼 추가
    const units = [...new Set(Object.keys(combinationData))];
    units.forEach(unit => {
        const button = createToggleButton(unit, 'unit');
        unitButtons.appendChild(button);
    });

    // 상태 버튼 추가
    STATES.forEach((state, index) => {
        if (index < STATES.length - 1) {
            const button = createToggleButton(state, 'currentState');
            button.onclick = function() {
                document.querySelectorAll('.toggle-btn[data-group="currentState"]').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
                updateTargetStateButtons();
            };
            currentStateButtons.appendChild(button);
        }
        if (index > 0) {
            const button = createToggleButton(state, 'targetState');
            targetStateButtons.appendChild(button);
        }
    });

    // 초기 목표 상태 버튼 비활성화
    updateTargetStateButtons();
}

function createToggleButton(text, group) {
    const button = document.createElement('div');
    button.textContent = text;
    button.className = 'toggle-btn';
    button.onclick = function() {
        document.querySelectorAll(`.toggle-btn[data-group="${group}"]`).forEach(btn => {
            btn.classList.remove('active');
        });
        this.classList.add('active');
        if (group === 'currentState') {
            updateTargetStateButtons();
        }
    };
    button.setAttribute('data-group', group);
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

function getSelectedValue(group) {
    const activeButton = document.querySelector(`.toggle-btn[data-group="${group}"].active`);
    return activeButton ? activeButton.textContent : null;
}

function calculate() {
    const unit = getSelectedValue('unit');
    const currentState = getSelectedValue('currentState');
    const targetState = getSelectedValue('targetState');

    if (!unit || !currentState || !targetState) {
        document.getElementById('result').textContent = "모든 옵션을 선택해주세요.";
        return;
    }

    const materials = calculateBaseMaterials(unit, currentState, targetState);
    
    let result = `${unit} ${currentState}에서 ${targetState}로 만들기 위해 필요한 기초+0 유닛:\n`;
    if (Object.keys(materials).length === 0) {
        result += "필요한 재료가 없거나 조합할 수 없습니다.";
    } else {
        for (const [material, count] of Object.entries(materials)) {
            result += `${material}: ${count}개\n`;
        }
    }

    document.getElementById('result').textContent = result;
}

function calculateBaseMaterials(unit, currentState, targetState) {
    const result = {};
    while (currentState !== targetState) {
        let key = `${currentState},${targetState}`;
        let materialInfo = combinationData[unit][key];

        if (!materialInfo) {
            const nextState = getNextState(currentState);
            if (!nextState) break;
            key = `${currentState},${nextState}`;
            materialInfo = combinationData[unit][key];
        }

        const [material, materialState] = materialInfo;

        if (materialState === '기초+0') {
            result[material] = (result[material] || 0) + 1;
        } else {
            const subMaterials = calculateBaseMaterials(material, '기초+0', materialState);
            for (const [subMaterial, count] of Object.entries(subMaterials)) {
                result[subMaterial] = (result[subMaterial] || 0) + count;
            }
        }

        currentState = getNextState(currentState);
    }
    return result;
}

function getNextState(state) {
    const index = STATES.indexOf(state);
    return index < STATES.length - 1 ? STATES[index + 1] : null;
}
