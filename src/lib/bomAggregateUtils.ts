/**
 * Tiện ích dùng chung cho phân tích và hiển thị ma trận Nguyên phụ liệu (BOM Aggregate).
 */

const standardSizeRank: Record<string, number> = {
  "3XS": 1,
  "XXXS": 1,
  "2XS": 2,
  "XXS": 2,
  "XS": 3,
  "S": 4,
  "M": 5,
  "L": 6,
  "XL": 7,
  "2XL": 8,
  "XXL": 8,
  "3XL": 9,
  "XXXL": 9,
  "4XL": 10,
  "XXXXL": 10,
  "5XL": 11,
  "6XL": 12,
  "FS": 90,
  "FREE": 90,
  "FREESIZE": 90,
};

/**
 * Sắp xếp cỡ số thông minh:
 * Ưu tiên kích cỡ chuẩn (XS, S, M, L, XL...), sau đó cỡ số theo số học (28, 29, 30...), cuối cùng là bảng chữ cái.
 */
export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const aNorm = a.toUpperCase().trim();
    const bNorm = b.toUpperCase().trim();
    const aRank = standardSizeRank[aNorm] ?? 100;
    const bRank = standardSizeRank[bNorm] ?? 100;
    if (aRank !== bRank) return aRank - bRank;
    const aNum = parseFloat(a);
    const bNum = parseFloat(b);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

/**
 * Gán class màu sắc đại diện cho tên màu NPL (Color bullet / dot)
 */
export function getColorDotClasses(colorName: string): {
  bgClass: string;
  borderClass: string;
  dotClass: string;
} {
  const norm = colorName.toLowerCase().trim();

  if (norm.includes("trắng") || norm.includes("white")) {
    return {
      bgClass: "bg-white",
      borderClass: "border border-gray-300 dark:border-gray-500",
      dotClass: "bg-white border border-gray-300 shadow-2xs",
    };
  }
  if (norm.includes("đen") || norm.includes("black")) {
    return {
      bgClass: "bg-gray-950 dark:bg-black",
      borderClass: "border border-transparent",
      dotClass: "bg-gray-900 border border-gray-800",
    };
  }
  if (norm.includes("navy") || norm.includes("xanh đen") || norm.includes("hải quân")) {
    return {
      bgClass: "bg-[#0c2340]",
      borderClass: "border border-transparent",
      dotClass: "bg-[#0c2340] border border-blue-900",
    };
  }
  if (norm.includes("xanh trắng")) {
    return {
      bgClass: "bg-sky-400",
      borderClass: "border border-sky-500",
      dotClass: "bg-sky-400 border border-sky-500",
    };
  }
  if (norm.includes("xám") || norm.includes("gray") || norm.includes("grey") || norm.includes("ghi")) {
    return {
      bgClass: "bg-gray-500",
      borderClass: "border border-transparent",
      dotClass: "bg-gray-400 border border-gray-500",
    };
  }
  if (norm.includes("đỏ") || norm.includes("red")) {
    return {
      bgClass: "bg-rose-600",
      borderClass: "border border-transparent",
      dotClass: "bg-red-600 border border-red-700",
    };
  }
  if (norm.includes("vàng") || norm.includes("yellow")) {
    return {
      bgClass: "bg-amber-400",
      borderClass: "border border-transparent",
      dotClass: "bg-amber-400 border border-amber-500",
    };
  }
  if (norm.includes("xanh lá") || norm.includes("green")) {
    return {
      bgClass: "bg-emerald-600",
      borderClass: "border border-transparent",
      dotClass: "bg-emerald-600 border border-emerald-700",
    };
  }
  if (norm.includes("xanh dương") || norm.includes("blue") || norm.includes("xanh")) {
    return {
      bgClass: "bg-blue-600",
      borderClass: "border border-transparent",
      dotClass: "bg-blue-600 border border-blue-700",
    };
  }
  if (norm.includes("cam") || norm.includes("orange")) {
    return {
      bgClass: "bg-orange-500",
      borderClass: "border border-transparent",
      dotClass: "bg-orange-500 border border-orange-600",
    };
  }
  if (norm.includes("tím") || norm.includes("purple") || norm.includes("violet")) {
    return {
      bgClass: "bg-purple-600",
      borderClass: "border border-transparent",
      dotClass: "bg-purple-600 border border-purple-700",
    };
  }
  if (norm.includes("hồng") || norm.includes("pink")) {
    return {
      bgClass: "bg-pink-500",
      borderClass: "border border-transparent",
      dotClass: "bg-pink-500 border border-pink-600",
    };
  }
  if (norm.includes("nâu") || norm.includes("brown")) {
    return {
      bgClass: "bg-amber-800",
      borderClass: "border border-transparent",
      dotClass: "bg-amber-800 border border-amber-900",
    };
  }
  if (norm.includes("be") || norm.includes("beige") || norm.includes("kem") || norm.includes("cream")) {
    return {
      bgClass: "bg-[#f5f5dc]",
      borderClass: "border border-gray-300",
      dotClass: "bg-[#f5f5dc] border border-gray-300",
    };
  }
  return {
    bgClass: "bg-indigo-500",
    borderClass: "border border-transparent",
    dotClass: "bg-blue-500 border border-blue-600",
  };
}

/**
 * Backward compatibility helper for components expecting single class string.
 */
export function getColorDotClass(colorName: string): string {
  return getColorDotClasses(colorName).dotClass;
}
