/**
 * Pure TypeScript In-Browser PDF Text Extractor
 * Extracts readable text streams from vector PDF drawings and schedules
 * using browser-native DecompressionStream without external dependencies.
 */

/**
 * Decompress a FlateDecode stream chunk
 */
async function decompressChunk(data: Uint8Array): Promise<string> {
  // First try native DecompressionStream('deflate')
  try {
    const ds = new DecompressionStream("deflate");
    const writer = ds.writable.getWriter();
    writer.write(data as any);
    writer.close();
    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    let totalLen = 0;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLen += value.length;
    }

    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return new TextDecoder("latin1").decode(merged);
  } catch {
    // Try raw deflate or fallback to plain text decode
    try {
      const ds = new DecompressionStream("deflate-raw");
      const writer = ds.writable.getWriter();
      writer.write(data as any);
      writer.close();
      const reader = ds.readable.getReader();
      const chunks: Uint8Array[] = [];
      let totalLen = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalLen += value.length;
      }

      const merged = new Uint8Array(totalLen);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      return new TextDecoder("latin1").decode(merged);
    } catch {
      return new TextDecoder("latin1").decode(data);
    }
  }
}

/**
 * Extract plain text string tokens from uncompressed PDF content stream
 */
function extractTextFromStream(streamStr: string): string[] {
  const lines: string[] = [];
  let currentLine: string[] = [];

  // Match BT ... ET blocks (Text objects)
  const btRegex = /BT([\s\S]*?)ET/g;
  let btMatch: RegExpExecArray | null;

  while ((btMatch = btRegex.exec(streamStr)) !== null) {
    const textBlock = btMatch[1];

    // Look for text positioning and text showing operators
    // Tj: (String) Tj
    // TJ: [(String) 123 (String)] TJ
    // Td, TD, T*, ': indicates newline or position change
    const ops = textBlock.split(/\r?\n/);

    for (const op of ops) {
      const trimmed = op.trim();
      if (!trimmed) continue;

      // Check line break operators
      if (
        trimmed.endsWith("T*") ||
        trimmed.endsWith("'") ||
        trimmed.endsWith('"') ||
        /\d+\s+-\d+\s+Td$/.test(trimmed)
      ) {
        if (currentLine.length > 0) {
          lines.push(currentLine.join(" ").trim());
          currentLine = [];
        }
      }

      // 1. Array text operator: [...] TJ
      const tjArrayMatch = trimmed.match(/\[(.*?)\]\s*TJ/);
      if (tjArrayMatch) {
        const inner = tjArrayMatch[1];
        const strMatches = inner.match(/\((.*?)\)/g);
        if (strMatches) {
          const piece = strMatches.map((s) => s.slice(1, -1)).join("");
          if (piece.trim()) currentLine.push(piece.trim());
        }
        continue;
      }

      // 2. Simple string operator: (...) Tj
      const tjMatch = trimmed.match(/\((.*?)\)\s*Tj/);
      if (tjMatch) {
        const piece = tjMatch[1];
        if (piece.trim()) currentLine.push(piece.trim());
        continue;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine.join(" ").trim());
      currentLine = [];
    }
  }

  // Fallback: If no BT/ET blocks matched, try global match for all (strings)
  if (lines.length === 0) {
    const literalStrings = streamStr.match(/\(([^()]{2,})\)/g);
    if (literalStrings) {
      return literalStrings.map((s) => s.slice(1, -1).trim()).filter((s) => s.length > 0);
    }
  }

  return lines;
}

/**
 * Main function: Extracts lines of text from an ArrayBuffer containing a PDF
 */
export async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(arrayBuffer);
  const latin1Str = new TextDecoder("latin1").decode(bytes);

  const extractedLines: string[] = [];

  // Locate all `stream` ... `endstream` blocks
  let searchIdx = 0;
  while (searchIdx < bytes.length) {
    const streamStartKeyword = latin1Str.indexOf("stream", searchIdx);
    if (streamStartKeyword === -1) break;

    // Check header before stream for /FlateDecode
    const dictHeaderStart = Math.max(0, streamStartKeyword - 300);
    const dictHeader = latin1Str.slice(dictHeaderStart, streamStartKeyword);
    const isFlate = dictHeader.includes("/FlateDecode");

    // Advance past 'stream' and newline
    let streamDataStart = streamStartKeyword + 6;
    if (bytes[streamDataStart] === 13 && bytes[streamDataStart + 1] === 10) {
      streamDataStart += 2; // \r\n
    } else if (bytes[streamDataStart] === 10 || bytes[streamDataStart] === 13) {
      streamDataStart += 1; // \n or \r
    }

    const endstreamIdx = latin1Str.indexOf("endstream", streamDataStart);
    if (endstreamIdx === -1) break;

    const streamData = bytes.subarray(streamDataStart, endstreamIdx);

    try {
      let decompressed = "";
      if (isFlate) {
        decompressed = await decompressChunk(streamData);
      } else {
        decompressed = new TextDecoder("latin1").decode(streamData);
      }

      if (decompressed && (decompressed.includes("BT") || decompressed.includes("Tj") || decompressed.includes("TJ"))) {
        const lines = extractTextFromStream(decompressed);
        if (lines.length > 0) {
          extractedLines.push(...lines);
        }
      }
    } catch {
      // Continue to next stream if this chunk fails
    }

    searchIdx = endstreamIdx + 9;
  }

  return extractedLines.join("\n");
}

