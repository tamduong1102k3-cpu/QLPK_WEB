package com.qlpk.backend.payment;

import com.qlpk.backend.entity.EventType;
import com.qlpk.backend.entity.HoaDon;
import com.qlpk.backend.entity.PhieuKham;
import com.qlpk.backend.payment.entity.GiaoDichThanhToan;
import com.qlpk.backend.payment.repository.GiaoDichThanhToanRepository;
import com.qlpk.backend.entity.TaiKhoan;
import com.qlpk.backend.entity.TaiKhoanBenhNhan;
import com.qlpk.backend.repository.HoaDonRepository;
import com.qlpk.backend.repository.PhieuKhamRepository;
import com.qlpk.backend.repository.TaiKhoanBenhNhanRepository;
import com.qlpk.backend.repository.TaiKhoanRepository;
import com.qlpk.backend.service.ThongBaoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class VnpayService {

    @Autowired
    private VnpayConfig vnpayConfig;

    @Autowired
    private HoaDonRepository hoaDonRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private GiaoDichThanhToanRepository giaoDichRepository;

    @Autowired
    private PhieuKhamRepository phieuKhamRepository;

    @Autowired
    private ThongBaoService thongBaoService;

    @Autowired
    private TaiKhoanBenhNhanRepository taiKhoanBenhNhanRepository;

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Transactional
    public String createPaymentUrl(Integer maHoaDon, HttpServletRequest request) throws Exception {
        HoaDon hd = hoaDonRepository.findById(maHoaDon)
                .orElseThrow(() -> new Exception("Không tìm thấy hóa đơn #" + maHoaDon));

        if ("da thanh toan".equalsIgnoreCase(hd.getTrangThai())) {
            throw new Exception("Hóa đơn đã được thanh toán trước đó.");
        }

        hd.setTrangThai("dang_cho_thanh_toan");

        hoaDonRepository.save(hd);

        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_TxnRef = maHoaDon + "_" + System.currentTimeMillis();
        String vnp_OrderInfo = "Thanh toan hoa don " + maHoaDon;
        String vnp_OrderType = "other";
        String vnp_Amount = String.valueOf(hd.getTongTien().multiply(java.math.BigDecimal.valueOf(100)).longValue());
        String vnp_Locale = "vn";

        String vnp_IpAddr = request.getRemoteAddr();
        if (vnp_IpAddr == null || vnp_IpAddr.contains(":") || vnp_IpAddr.equals("127.0.0.1")) {
            vnp_IpAddr = "127.0.0.1";
        }

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("GMT+7"));
        String vnp_CreateDate = formatter.format(cld.getTime());

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnpayConfig.getTmnCode());
        vnp_Params.put("vnp_Amount", vnp_Amount);
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
        vnp_Params.put("vnp_OrderType", vnp_OrderType);
        vnp_Params.put("vnp_Locale", vnp_Locale);
        vnp_Params.put("vnp_ReturnUrl", vnpayConfig.getReturnUrl());
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                if (hashData.length() > 0) hashData.append('&');
                if (query.length() > 0) query.append('&');
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
            }
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = vnpayConfig.hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

        return vnpayConfig.getPayUrl() + "?" + queryUrl;
    }

    @Transactional
    public Map<String, String> processPaymentReturn(Map<String, String> fields) {
        Map<String, String> response = new HashMap<>();
        try {
            String vnp_SecureHash = fields.get("vnp_SecureHash");
            fields.remove("vnp_SecureHashType");
            fields.remove("vnp_SecureHash");

            List<String> fieldNames = new ArrayList<>(fields.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = fields.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    if (hashData.length() > 0) hashData.append('&');
                    hashData.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                }
            }

            String calculatedHash = vnpayConfig.hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());
            if (!calculatedHash.equalsIgnoreCase(vnp_SecureHash)) {
                response.put("RspCode", "97");
                response.put("Message", "Invalid Checksum");
                return response;
            }

            String vnp_TxnRef = fields.get("vnp_TxnRef");
            if (vnp_TxnRef == null || !vnp_TxnRef.contains("_")) {
                response.put("RspCode", "01");
                response.put("Message", "Order not Found");
                return response;
            }
            Integer maHoaDon = Integer.parseInt(vnp_TxnRef.split("_")[0]);

            String vnp_ResponseCode = fields.get("vnp_ResponseCode");
            String vnp_TransactionNo = fields.get("vnp_TransactionNo");

            Optional<HoaDon> hdOpt = hoaDonRepository.findById(maHoaDon);
            if (!hdOpt.isPresent()) {
                response.put("RspCode", "01");
                response.put("Message", "Order not Found");
                return response;
            }
            HoaDon hd = hdOpt.get();

            if ("da thanh toan".equalsIgnoreCase(hd.getTrangThai())) {
                response.put("RspCode", "02");
                response.put("Message", "Order already confirmed");
                return response;
            }

            long vnpAmount = Long.parseLong(fields.get("vnp_Amount"));
            long dbAmount = hd.getTongTien().multiply(java.math.BigDecimal.valueOf(100)).longValue();
            if (vnpAmount != dbAmount) {
                response.put("RspCode", "04");
                response.put("Message", "Invalid Amount");
                return response;
            }

            if ("00".equals(vnp_ResponseCode)) {
                hd.setTrangThai("da thanh toan");
                hd.setPhuongThucThanhToan("VNPAY");
                hd.setMaGiaoDich(vnp_TransactionNo);
                hd.setNgayThanhToan(LocalDateTime.now());
                hoaDonRepository.save(hd);

                GiaoDichThanhToan giaoDich = new GiaoDichThanhToan();
                giaoDich.setMaHoaDon(maHoaDon);
                giaoDich.setProvider("VNPAY");
                giaoDich.setOrderId(vnp_TxnRef);
                giaoDich.setRequestId(fields.get("vnp_PayDate"));
                giaoDich.setTransId(vnp_TransactionNo);
                giaoDich.setSoTien(hd.getTongTien());
                giaoDich.setTrangThai("da thanh toan");
                giaoDich.setCreatedAt(LocalDateTime.now());
                giaoDichRepository.save(giaoDich);

                messagingTemplate.convertAndSend(
                        "/topic/payment",
                        new PaymentEvent(maHoaDon, "da thanh toan")
                );

                try {
                    if (hd.getMaPhieuKham() != null) {
                        PhieuKham phieuKham = phieuKhamRepository.findById(hd.getMaPhieuKham()).orElse(null);
                        if (phieuKham != null && phieuKham.getMaBenhNhan() != null) {

                            Integer maTaiKhoanBn = null;
                            TaiKhoanBenhNhan taiKhoan = taiKhoanBenhNhanRepository
                                .findByMaBenhNhan(phieuKham.getMaBenhNhan()).orElse(null);
                            if (taiKhoan != null) {
                                maTaiKhoanBn = taiKhoan.getMaTaiKhoanBn();
                            }
                            if (maTaiKhoanBn != null) {
                                String tieuDe = "Thanh toán VNPAY thành công";
                                String noiDung = "Hóa đơn #" + hd.getMaHoaDon() + " đã được thanh toán qua VNPAY thành công với số tiền "
                                               + (hd.getTongTien() != null ? hd.getTongTien().toString() : "0") + " VNĐ.";

                                Integer maTaiKhoanNhanVien = null;
                                if (hd.getMaNhanVien() != null) {
                                    TaiKhoan tk = taiKhoanRepository.findByMaNhanVien(hd.getMaNhanVien());
                                    if (tk != null) {
                                        maTaiKhoanNhanVien = tk.getMaTaiKhoan();
                                    }
                                }
                                thongBaoService.createThongBao(
                                    maTaiKhoanBn,
                                    maTaiKhoanNhanVien,
                                    "BENH_NHAN",
                                    tieuDe,
                                    noiDung,
                                    "HOA_DON",
                                    hd.getMaHoaDon().toString(),
                                    EventType.PAYMENT_VNPAY_SUCCESS.name(),
                                    false,
                                    true
                                );
                            }
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Lỗi khi tạo thông báo VNPAY: " + e.getMessage());
                }
            }

            response.put("RspCode", "00");
            response.put("Message", "Confirm Success");
            return response;

        } catch (Exception e) {
            response.put("RspCode", "99");
            response.put("Message", "Unknown error: " + e.getMessage());
            return response;
        }
    }

    @Transactional
    public Map<String, String> processPaymentIpn(Map<String, String> fields) {
        Map<String, String> response = new HashMap<>();
        try {
            String vnp_SecureHash = fields.get("vnp_SecureHash");
            fields.remove("vnp_SecureHashType");
            fields.remove("vnp_SecureHash");

            List<String> fieldNames = new ArrayList<>(fields.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = fields.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    if (hashData.length() > 0) hashData.append('&');
                    hashData.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                }
            }

            String calculatedHash = vnpayConfig.hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());
            if (!calculatedHash.equalsIgnoreCase(vnp_SecureHash)) {
                response.put("RspCode", "97");
                response.put("Message", "Invalid Checksum");
                return response;
            }

            String vnp_TxnRef = fields.get("vnp_TxnRef");
            if (vnp_TxnRef == null || !vnp_TxnRef.contains("_")) {
                response.put("RspCode", "01");
                response.put("Message", "Order not Found");
                return response;
            }
            Integer maHoaDon = Integer.parseInt(vnp_TxnRef.split("_")[0]);

            Optional<HoaDon> hdOpt = hoaDonRepository.findById(maHoaDon);
            if (!hdOpt.isPresent()) {
                response.put("RspCode", "01");
                response.put("Message", "Order not Found");
                return response;
            }
            HoaDon hd = hdOpt.get();

            long vnpAmount = Long.parseLong(fields.get("vnp_Amount"));
            long dbAmount = hd.getTongTien().multiply(java.math.BigDecimal.valueOf(100)).longValue();
            if (vnpAmount != dbAmount) {
                response.put("RspCode", "04");
                response.put("Message", "Invalid Amount");
                return response;
            }

            if ("da thanh toan".equalsIgnoreCase(hd.getTrangThai())) {
                response.put("RspCode", "02");
                response.put("Message", "Order already confirmed");
                return response;
            }

            String vnp_ResponseCode = fields.get("vnp_ResponseCode");
            String vnp_TransactionNo = fields.get("vnp_TransactionNo");

            if ("00".equals(vnp_ResponseCode)) {

                if (!"da thanh toan".equalsIgnoreCase(hd.getTrangThai())) {
                    hd.setTrangThai("da thanh toan");
                    hd.setPhuongThucThanhToan("VNPAY");
                    hd.setMaGiaoDich(vnp_TransactionNo);
                    hd.setNgayThanhToan(LocalDateTime.now());
                    hoaDonRepository.save(hd);

                    GiaoDichThanhToan giaoDich = new GiaoDichThanhToan();
                    giaoDich.setMaHoaDon(maHoaDon);
                    giaoDich.setProvider("VNPAY");
                    giaoDich.setOrderId(vnp_TxnRef);
                    giaoDich.setRequestId(fields.get("vnp_PayDate"));
                    giaoDich.setTransId(vnp_TransactionNo);
                    giaoDich.setSoTien(hd.getTongTien());
                    giaoDich.setTrangThai("da thanh toan");
                    giaoDich.setCreatedAt(LocalDateTime.now());
                    giaoDichRepository.save(giaoDich);

                    messagingTemplate.convertAndSend(
                            "/topic/payment",
                            new PaymentEvent(maHoaDon, "da thanh toan")
                    );
                }

                try {
                    if (hd.getMaPhieuKham() != null) {
                        PhieuKham phieuKham = phieuKhamRepository.findById(hd.getMaPhieuKham()).orElse(null);
                        if (phieuKham != null && phieuKham.getMaBenhNhan() != null) {

                            Integer maTaiKhoanBn = null;
                            TaiKhoanBenhNhan taiKhoan = taiKhoanBenhNhanRepository
                                .findByMaBenhNhan(phieuKham.getMaBenhNhan()).orElse(null);
                            if (taiKhoan != null) {
                                maTaiKhoanBn = taiKhoan.getMaTaiKhoanBn();
                            }
                            if (maTaiKhoanBn != null) {
                                String tieuDe = "Thanh toán VNPAY thành công";
                                String noiDung = "Hóa đơn #" + hd.getMaHoaDon() + " đã được thanh toán qua VNPAY thành công với số tiền "
                                               + (hd.getTongTien() != null ? hd.getTongTien().toString() : "0") + " VNĐ.";

                                Integer maTaiKhoanNhanVien = null;
                                if (hd.getMaNhanVien() != null) {
                                    TaiKhoan tk = taiKhoanRepository.findByMaNhanVien(hd.getMaNhanVien());
                                    if (tk != null) {
                                        maTaiKhoanNhanVien = tk.getMaTaiKhoan();
                                    }
                                }
                                thongBaoService.createThongBao(
                                    maTaiKhoanBn,
                                    maTaiKhoanNhanVien,
                                    "BENH_NHAN",
                                    tieuDe,
                                    noiDung,
                                    "HOA_DON",
                                    hd.getMaHoaDon().toString(),
                                    EventType.PAYMENT_VNPAY_SUCCESS.name(),
                                    false,
                                    true
                                );
                            }
                        } else {
                            System.err.println("KHÔNG TẠO ĐƯỢC THÔNG BÁO: phieuKham=" + phieuKham 
                                + ", maBenhNhan=" + (phieuKham != null ? phieuKham.getMaBenhNhan() : "N/A"));
                        }
                    } else {
                        System.err.println("KHÔNG TẠO ĐƯỢC THÔNG BÁO: Hóa đơn #" + maHoaDon + " không có maPhieuKham");
                    }
                } catch (Exception e) {
                    System.err.println("Lỗi khi tạo thông báo VNPAY cho bệnh nhân: " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                hd.setTrangThai("chua thanh toan");
                hoaDonRepository.save(hd);
            }

            response.put("RspCode", "00");
            response.put("Message", "Confirm Success");
            return response;

        } catch (Exception e) {
            response.put("RspCode", "99");
            response.put("Message", "Unknown error: " + e.getMessage());
            return response;
        }
    }

    public boolean verifyReturnUrl(Map<String, String> fields) throws Exception {
        String vnp_SecureHash = fields.get("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");
        fields.remove("vnp_SecureHash");

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                if (hashData.length() > 0) hashData.append('&');
                hashData.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
            }
        }

        String calculatedHash = vnpayConfig.hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());
        return calculatedHash.equalsIgnoreCase(vnp_SecureHash);
    }
}
