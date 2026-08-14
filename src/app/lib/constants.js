/** @type {Record<string, { label: string; monacoLang: string; judge0Id: number; snippet: string }>} */
export const LANGUAGES = {
  java: {
    label: "Java (OpenJDK 17)",
    monacoLang: "java",
    judge0Id: 62, // Java (OpenJDK 13.0.1)
    snippet: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int t = sc.nextInt();
        
        while(t-->0){

        }
    }
}
`,
  },
  cpp: {
    label: "C++ (GCC 9)",
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
  python: {
    label: "Python 3.8",
    monacoLang: "python",
    judge0Id: 71, // Python (3.8.1)
    snippet: `import sys
input = sys.stdin.readline

def main():
    pass

main()
`,
  },
  c: {
    label: "C (GCC 9)",
    monacoLang: "c",
    judge0Id: 50, // C (GCC 9.2.0)
    snippet: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    
    return 0;
}
`,
  },
};

export const STORAGE_KEY = "cp-editor-state";
export const THEME_KEY = "cp-editor-theme";
export const DEBOUNCE_MS = 800;
export const STATE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
