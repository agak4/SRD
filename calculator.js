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
    const unitSelect = document.getElementById('unit');
    const currentStateSelect = document.getElementById('currentState');
    const targetStateSelect = document.getElementById('targetState');

    // 유닛 옵션 추가
    Object.keys(combinationData).forEach(unit => {
        const option = document.createElement('option');
        option.value = option.textContent = unit;
        unitSelect.appendChild(option);
    });

    // 상태 옵션 추가
    STATES.forEach((state, index) => {
        if (index < STATES.length - 1) {
            const option = document.createElement('option');
            option.value = option.textContent = state;
            currentStateSelect.appendChild(option);
        }
        if (index > 0) {
            const option = document.createElement('option');
            option.value = option.textContent = state;
            targetStateSelect.appendChild(option);
        }
    });
}

function calculate() {
    const unit = document.getElementById('unit').value;
    let currentState = document.getElementById('currentState').value;
    const targetState = document.getElementById('targetState').value;

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