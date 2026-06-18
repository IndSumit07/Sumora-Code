/** @type {Record<string, { label: string; monacoLang: string; judge0Id: number; snippet: string }>} */
export const LANGUAGES = {
  java: {
    label: "Java",
    monacoLang: "java",
    judge0Id: 62,
    snippet: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
  },
  cpp: {
    label: "C++",
    monacoLang: "cpp",
    judge0Id: 54,
    snippet: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
  },
};

export const STORAGE_KEY = "cp-editor-state";
export const THEME_KEY = "cp-editor-theme";
export const DEBOUNCE_MS = 800;
export const STATE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
