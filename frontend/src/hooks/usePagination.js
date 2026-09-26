import { useState, useEffect, useMemo, useCallback } from 'react';
import { sqlLikeMatch } from '../utils/searchUtils';

/**
 * Hook phân trang dùng chung - hỗ trợ cả tìm kiếm (search) và filter.
 *
 * Cách dùng:
 *   const pag = usePagination({
 *     data: patients,           // Mảng dữ liệu gốc
 *     pageSize: 10,             // Số item mỗi trang
 *     searchKeys: ['hoTen', 'soDienThoai'],  // Các key để tìm kiếm (bỏ dấu tiếng Việt)
 *     searchTerm: externalTerm, // (Tùy chọn) nếu muốn điều khiển search từ ngoài
 *     filters: (item) => ...    // (Tùy chọn) hàm filter tùy chỉnh
 *   });
 *
 * Trả về:
 *   search, setSearch          - state tìm kiếm nội bộ (dùng cho input)
 *   filteredData               - dữ liệu đã qua filter + search
 *   paginatedData              - dữ liệu trang hiện tại (để map render)
 *   totalItems, totalPages     - tổng số item / tổng số trang
 *   currentPage, setCurrentPage - trang hiện tại + setter
 *   safeCurrentPage            - trang an toàn (không vượt totalPages)
 *   visiblePages               - danh sách trang hiển thị (VD: [1,2,'...',8,9])
 *   jumpPage, setJumpPage, pageError - state cho ô nhập trang nhanh
 *   handleJumpPage(value)      - xử lý nhập trang nhanh, tự validate
 *   resetPage()                - đưa về trang 1
 */
export const usePagination = ({
  data = [],
  pageSize = 10,
  searchKeys = [],
  searchTerm = undefined,
  filters = null,
  resetOnChange = true,
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPage, setJumpPage] = useState('');
  const [pageError, setPageError] = useState('');

  // Nếu có searchTerm truyền vào từ ngoài -> dùng nó (controlled), ngược lại dùng state nội bộ
  const isControlled = searchTerm !== undefined;
  const search = isControlled ? searchTerm : internalSearch;
  const setSearch = useCallback(
    (value) => {
      if (!isControlled) setInternalSearch(value);
    },
    [isControlled]
  );

  // Lọc dữ liệu theo filter + search
  const filteredData = useMemo(() => {
    let result = Array.isArray(data) ? data : [];
    if (filters) result = result.filter(filters);
    if (search && searchKeys.length > 0) {
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const val = item ? item[key] : undefined;
          return sqlLikeMatch(val, search);
        })
      );
    }
    return result;
  }, [data, filters, search, searchKeys]);

  // Tổng số trang
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Dữ liệu trang hiện tại
  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, safeCurrentPage, pageSize]);

  // Tự reset về trang 1 khi search / filter thay đổi.
  // KHÔNG đưa `data` vào deps vì các component truyền mảng tính toán mới mỗi render
  // (VD: filteredEmployees, filtered, activeList) → dependency đổi liên tục
  // sẽ reset currentPage về 1 mỗi lần render → không chuyển trang được.
  useEffect(() => {
    if (resetOnChange) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters, resetOnChange]);

  // Danh sách trang hiển thị (cửa sổ 5 trang + dấu ...)
  const visiblePages = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const s = Math.max(1, safeCurrentPage - 2);
      const e = Math.min(totalPages, s + maxVisible - 1);
      const adj = Math.max(1, e - maxVisible + 1);
      for (let i = adj; i <= e; i++) pages.push(i);
      if (adj > 1) pages.unshift('...');
      if (e < totalPages) pages.push('...');
    }
    return pages;
  }, [totalPages, safeCurrentPage]);

  // Xử lý nhập trang nhanh
  const handleJumpPage = useCallback(
    (value) => {
      setJumpPage(value);
      const page = Number(value);
      if (value === '') {
        setPageError('');
        return;
      }
      if (Number.isInteger(page)) {
        if (page >= 1 && page <= totalPages) {
          setCurrentPage(page);
          setPageError('');
        } else {
          setPageError(`Không có trang ${value} cần tìm`);
        }
      } else {
        setPageError(`Không có trang ${value} cần tìm`);
      }
    },
    [totalPages]
  );

  const handleJumpPageBlur = useCallback(() => {
    setJumpPage('');
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
    setJumpPage('');
    setPageError('');
  }, []);

  return {
    // Search
    search,
    setSearch,
    // Data
    filteredData,
    paginatedData,
    totalItems: filteredData.length,
    // Page state
    currentPage,
    setCurrentPage,
    safeCurrentPage,
    totalPages,
    visiblePages,
    resetPage,
    // Jump page
    jumpPage,
    setJumpPage,
    pageError,
    handleJumpPage,
    handleJumpPageBlur,
  };
};

export default usePagination;