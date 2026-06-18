import { LANGUAGES } from "@/app/lib/constants";
import { requireAuth } from "@/app/lib/auth";

/**
 * POST /api/execute
 * Body: { language: 'java' | 'cpp', code: string, stdin: string }
 * Returns: { stdout, stderr, compileOutput, status }
 */
export const POST = requireAuth(async (_userId, request) => {
  const apiUrl = process.env.JUDGE0_API_URL;
  const apiKey = process.env.JUDGE0_API_KEY;

  if (!apiUrl) {
    return Response.json(
      { error: "JUDGE0_API_URL is not configured. Check your .env.local." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { language, code, stdin = "" } = body;

  if (!language || !code) {
    return Response.json(
      { error: "Missing required fields: language, code." },
      { status: 400 }
    );
  }

  const langConfig = LANGUAGES[language];
  if (!langConfig) {
    return Response.json(
      { error: `Unknown language: ${language}` },
      { status: 400 }
    );
  }

  // Build the Judge0 submission
  const submission = {
    language_id: langConfig.judge0Id,
    source_code: code,
    stdin: stdin,
    // Reasonable resource limits
    cpu_time_limit: 5,        // seconds
    memory_limit: 256000,     // KB (~256 MB)
  };

  try {
    // Use ?wait=true for synchronous result (no polling needed)
    const judge0Url = `${apiUrl}/submissions?base64_encoded=false&wait=true`;

    const headers = {
      "Content-Type": "application/json",
    };

    // Auth header logic:
    // - Self-hosted Judge0 → X-Auth-Token (configured via AUTHN_TOKEN in docker-compose)
    // - RapidAPI hosted    → X-RapidAPI-Key + X-RapidAPI-Host
    const isRapidApi = apiUrl.includes("rapidapi.com");
    if (apiKey && apiKey !== "your_rapidapi_key_here") {
      if (isRapidApi) {
        headers["X-RapidAPI-Key"] = apiKey;
        headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
      } else {
        // Self-hosted with AUTHN_TOKEN configured
        headers["X-Auth-Token"] = apiKey;
      }
    }
    // If apiKey is blank → self-hosted with no auth (default docker-compose setup)

    const judge0Response = await fetch(judge0Url, {
      method: "POST",
      headers,
      body: JSON.stringify(submission),
    });

    if (!judge0Response.ok) {
      const errText = await judge0Response.text();
      console.error("Judge0 error:", judge0Response.status, errText);
      return Response.json(
        {
          error: `Code execution service returned ${judge0Response.status}. ${
            judge0Response.status === 401 || judge0Response.status === 403
              ? "Check your JUDGE0_API_KEY in .env.local."
              : "Try again in a moment."
          }`,
        },
        { status: 502 }
      );
    }

    const result = await judge0Response.json();

    // Judge0 status IDs:
    // 1=In Queue, 2=Processing, 3=Accepted, 4=Wrong Answer,
    // 5=TLE, 6=Compilation Error, 7-12=Runtime Error variants, 13=Internal Error
    const statusId = result.status?.id;
    const isCompileError = statusId === 6;
    const isRuntimeError = statusId >= 7 && statusId <= 12;
    const isTLE = statusId === 5;

    let stdout = result.stdout || "";
    let stderr = result.stderr || "";
    let compileOutput = result.compile_output || "";

    // Build a unified output string for compile errors
    let displayOutput = "";
    let isError = false;

    if (isCompileError) {
      displayOutput = compileOutput || "Compilation failed (no output).";
      isError = true;
    } else if (isTLE) {
      displayOutput = "⏱ Time Limit Exceeded (> 5 seconds).";
      isError = true;
    } else if (isRuntimeError) {
      displayOutput = stderr
        ? `Runtime Error:\n${stderr}`
        : `Runtime Error (exit code ${result.exit_code ?? "unknown"}).`;
      isError = true;
    } else {
      // Accepted or other status — show stdout, fall back to stderr
      displayOutput = stdout || stderr || "(no output)";
      isError = !!stderr && !stdout;
    }

    return Response.json({
      output: displayOutput,
      isError,
      statusId,
      statusDescription: result.status?.description ?? "Unknown",
    });
  } catch (err) {
    console.error("Execute route error:", err);
    return Response.json(
      { error: `Failed to reach the code execution service: ${err.message}` },
      { status: 503 }
    );
  }
});
