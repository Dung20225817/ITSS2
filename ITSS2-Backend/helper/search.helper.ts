// helper/search.helper.ts
export const SearchHelper = (query) => {
  if (query.keyword) {
    const keyword = query.keyword.toString().trim();
    return {
      regex: new RegExp(keyword, "i"), // không phân biệt hoa thường
    };
  }
  return {};
};