/**
 * Convert buffer to string
 * @param buff array buffer
 */
function ab2str(buff: ArrayBuffer): string | undefined {
  try {
    return String.fromCharCode.apply(null, new Uint16Array(buff) as any);
  } catch (e) {
    console.error('Convert buff to string error', e);
  }
}

/**
 * Covnert string to array buffer
 * @param str A string
 */
function str2ab(str: string): ArrayBuffer | undefined {
  try {
    const buff = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    const buffView = new Uint16Array(buff);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      buffView[i] = str.charCodeAt(i);
    }

    return buff;
  } catch (e) {
    console.error('Convert string to buffer error', e);
  }
}

export { ab2str, str2ab };
