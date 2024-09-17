import java.util.*;
import java.io.*;

public class CombinationCalculator {
    private static Map<String, Map<String, String[]>> combinationData = new HashMap<>();
    private static final String[] STATES = {"기초+0", "기초+1", "기초+2", "특별+0", "특별+1", "특별+2", "정예+0", "정예+1", "정예+2", "전설+0"};

    public static void loadCombinationData(String filename) {
        try (BufferedReader br = new BufferedReader(new FileReader(filename))) {
            String line;
            br.readLine(); // Skip header
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(",");
                String unit = parts[0];
                String currentState = parts[1];
                String targetState = parts[2];
                String material = parts[3];
                String materialState = parts[4];

                combinationData.computeIfAbsent(unit, k -> new HashMap<>())
                        .put(currentState + "," + targetState, new String[]{material, materialState});
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static Map<String, Integer> calculateBaseMaterials(String unit, String currentState, String targetState) {
        Map<String, Integer> result = new HashMap<>();
        while (!currentState.equals(targetState)) {
            String key = currentState + "," + targetState;
            String[] materialInfo = combinationData.get(unit).get(key);

            if (materialInfo == null) {
                String nextState = getNextState(currentState);
                if (nextState == null) break;
                key = currentState + "," + nextState;
                materialInfo = combinationData.get(unit).get(key);
            }

            String material = materialInfo[0];
            String materialState = materialInfo[1];

            if (materialState.equals("기초+0")) {
                result.put(material, result.getOrDefault(material, 0) + 1);
            } else {
                Map<String, Integer> subMaterials = calculateBaseMaterials(material, "기초+0", materialState);
                for (Map.Entry<String, Integer> entry : subMaterials.entrySet()) {
                    result.put(entry.getKey(), result.getOrDefault(entry.getKey(), 0) + entry.getValue());
                }
            }

            currentState = getNextState(currentState);
        }
        return result;
    }

    private static String getNextState(String state) {
        for (int i = 0; i < STATES.length - 1; i++) {
            if (STATES[i].equals(state)) {
                return STATES[i + 1];
            }
        }
        return null;
    }

    public static Set<String> getUnits() {
        return combinationData.keySet();
    }
}