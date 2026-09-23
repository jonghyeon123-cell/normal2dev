// 사전 색인에 쓰는 첫 글자. 한글은 초성(된소리는 예사소리로), 영문은 A–Z, 나머지는 #.
const CHOSEONG = [..."ㄱㄱㄴㄷㄷㄹㅁㅂㅂㅅㅅㅇㅈㅈㅊㅋㅌㅍㅎ"];

export const INITIAL_ORDER = [..."ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ", "A–Z", "#"];

export function initialOf(word: string): string {
  const code = word.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return CHOSEONG[Math.floor((code - 0xac00) / 588)];
  if (/[a-z]/i.test(word[0])) return "A–Z";
  return "#";
}
