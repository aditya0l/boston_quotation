export function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const numToWords = (n: number, suffix: string): string => {
    let str = "";
    if (n > 19) {
      str += b[Math.floor(n / 10)] + " " + a[n % 10];
    } else {
      str += a[n];
    }
    if (n !== 0) str += suffix;
    return str;
  };

  let out = "";
  out += numToWords(Math.floor(num / 10000000), "Crore ");
  out += numToWords(Math.floor((num / 100000) % 100), "Lakh ");
  out += numToWords(Math.floor((num / 1000) % 100), "Thousand ");
  out += numToWords(Math.floor((num / 100) % 10), "Hundred ");

  if (num > 100 && num % 100 > 0) {
    out += "and ";
  }
  out += numToWords(Math.floor(num % 100), "");

  return out.trim() + " Only";
}
