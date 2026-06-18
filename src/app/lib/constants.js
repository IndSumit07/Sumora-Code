/** @type {Record<string, { label: string; monacoLang: string; judge0Id: number; snippet: string }>} */
export const LANGUAGES = {
  java: {
    label: "Java",
    monacoLang: "java",
    judge0Id: 62, // Java (OpenJDK 13.0.1)
    snippet: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
     
    }
}
`,
  },
  cpp: {
    label: "C++",
    monacoLang: "cpp",
    judge0Id: 54, // C++ (GCC 9.2.0)
    snippet: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    
    return 0;
}
`,
  },
};

export const STORAGE_KEY = "cp-editor-state";
export const THEME_KEY = "cp-editor-theme";
export const DEBOUNCE_MS = 800;
export const STATE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
