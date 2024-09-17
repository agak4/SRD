import sys
import csv
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QHBoxLayout, QComboBox, QPushButton, QTextEdit, QLabel

# 데이터 로드 함수
def load_combination_data(filename):
    combination_data = {}
    with open(filename, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            key = (row['유닛'], row['현재 상태'], row['목표 상태'])
            value = (row['필요 재료'], row['재료 상태'])
            combination_data[key] = value
    return combination_data

# 재귀적으로 필요한 기초+0 재료 계산
def calculate_base_materials(combination_data, unit, current_state, target_state):
    if current_state == target_state:
        return {}
    
    result = {}
    while current_state != target_state:
        key = (unit, current_state, target_state)
        if key not in combination_data:
            next_state = get_next_state(current_state)
            if not next_state:
                break
            key = (unit, current_state, next_state)
        
        material, material_state = combination_data[key]
        
        if material_state == '기초+0':
            result[material] = result.get(material, 0) + 1
        else:
            sub_materials = calculate_base_materials(combination_data, material, '기초+0', material_state)
            for sub_material, count in sub_materials.items():
                result[sub_material] = result.get(sub_material, 0) + count
        
        current_state = get_next_state(current_state)
    
    return result

# 다음 상태 얻기
def get_next_state(state):
    states = ['기초+0', '기초+1', '기초+2', '특별+0', '특별+1', '특별+2', '정예+0', '정예+1', '정예+2', '전설+0']
    try:
        index = states.index(state)
        if index < len(states) - 1:
            return states[index + 1]
    except ValueError:
        pass
    return None

class CombinationCalculator(QWidget):
    def __init__(self):
        super().__init__()
        self.combination_data = load_combination_data('combination_data.csv')
        self.initUI()
        
    def initUI(self):
        layout = QVBoxLayout()
        
        # 유닛 선택
        unit_layout = QHBoxLayout()
        unit_layout.addWidget(QLabel('유닛:'))
        self.unit_combo = QComboBox()
        self.unit_combo.addItems(sorted(set(key[0] for key in self.combination_data.keys())))
        unit_layout.addWidget(self.unit_combo)
        layout.addLayout(unit_layout)
        
        # 현재 상태 선택
        current_state_layout = QHBoxLayout()
        current_state_layout.addWidget(QLabel('현재 상태:'))
        self.current_state_combo = QComboBox()
        self.current_state_combo.addItems(['기초+0', '기초+1', '기초+2', '특별+0', '특별+1', '특별+2', '정예+0', '정예+1', '정예+2'])
        current_state_layout.addWidget(self.current_state_combo)
        layout.addLayout(current_state_layout)
        
        # 목표 상태 선택
        target_state_layout = QHBoxLayout()
        target_state_layout.addWidget(QLabel('목표 상태:'))
        self.target_state_combo = QComboBox()
        self.target_state_combo.addItems(['기초+1', '기초+2', '특별+0', '특별+1', '특별+2', '정예+0', '정예+1', '정예+2', '전설+0'])
        target_state_layout.addWidget(self.target_state_combo)
        layout.addLayout(target_state_layout)
        
        # 계산 버튼
        self.calculate_btn = QPushButton('계산')
        self.calculate_btn.clicked.connect(self.on_calculate)
        layout.addWidget(self.calculate_btn)
        
        # 결과 표시
        self.result_text = QTextEdit()
        self.result_text.setReadOnly(True)
        layout.addWidget(self.result_text)
        
        self.setLayout(layout)
        self.setWindowTitle('유닛 조합 계산기')
        self.setGeometry(300, 300, 400, 300)
        self.show()
    
    def on_calculate(self):
        unit = self.unit_combo.currentText()
        current_state = self.current_state_combo.currentText()
        target_state = self.target_state_combo.currentText()
        materials = calculate_base_materials(self.combination_data, unit, current_state, target_state)
        
        result = f"{unit} {current_state}에서 {target_state}로 만들기 위해 필요한 기초+0 유닛:\n"
        if not materials:
            result += "필요한 재료가 없거나 조합할 수 없습니다."
        else:
            for material, count in materials.items():
                result += f"{material}: {count}개\n"
        
        self.result_text.setText(result)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = CombinationCalculator()
    sys.exit(app.exec_())