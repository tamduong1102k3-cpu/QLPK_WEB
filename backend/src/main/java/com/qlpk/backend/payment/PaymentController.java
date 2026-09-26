package com.qlpk.backend.payment;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private VnpayService vnpayService;

    @PostMapping("/vnpay/create/{maHoaDon}")
    public ResponseEntity<?> createVnpayPayment(@PathVariable Integer maHoaDon, HttpServletRequest request) {
        try {
            String paymentUrl = vnpayService.createPaymentUrl(maHoaDon, request);
            return ResponseEntity.ok(Map.of("url", paymentUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/vnpay/return")
    public void vnpayReturn(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Map<String, String> fields = new HashMap<>();
        for (Map.Entry<String, String[]> entry : request.getParameterMap().entrySet()) {
            if (entry.getValue() != null && entry.getValue().length > 0) {
                fields.put(entry.getKey(), entry.getValue()[0]);
            }
        }

        String vnp_TxnRef = fields.get("vnp_TxnRef");
        String maHoaDon = "";
        if (vnp_TxnRef != null && vnp_TxnRef.contains("_")) {
            maHoaDon = vnp_TxnRef.split("_")[0];
        }

        String vnp_ResponseCode = fields.get("vnp_ResponseCode");
        String vnp_TransactionNo = fields.get("vnp_TransactionNo") != null ? fields.get("vnp_TransactionNo") : "";
        String vnp_PayDate = fields.get("vnp_PayDate") != null ? fields.get("vnp_PayDate") : "";

        try {

            Map<String, String> result = vnpayService.processPaymentReturn(fields);

            if ("00".equals(vnp_ResponseCode)) {

                response.sendRedirect("http://localhost:5173/payment/result?status=success&maHoaDon=" + maHoaDon 
                        + "&transactionNo=" + URLEncoder.encode(vnp_TransactionNo, StandardCharsets.UTF_8.toString())
                        + "&payDate=" + URLEncoder.encode(vnp_PayDate, StandardCharsets.UTF_8.toString()));
            } else {
                String errorMsg = getFriendlyMessage(vnp_ResponseCode);
                response.sendRedirect("http://localhost:5173/payment/result?status=fail&maHoaDon=" + maHoaDon 
                        + "&message=" + URLEncoder.encode(errorMsg, StandardCharsets.UTF_8.toString())
                        + "&transactionNo=" + URLEncoder.encode(vnp_TransactionNo, StandardCharsets.UTF_8.toString())
                        + "&payDate=" + URLEncoder.encode(vnp_PayDate, StandardCharsets.UTF_8.toString()));
            }
        } catch (Exception e) {
            response.sendRedirect("http://localhost:5173/payment/result?status=error&maHoaDon=" + maHoaDon 
                    + "&message=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8.toString())
                    + "&transactionNo=" + URLEncoder.encode(vnp_TransactionNo, StandardCharsets.UTF_8.toString())
                    + "&payDate=" + URLEncoder.encode(vnp_PayDate, StandardCharsets.UTF_8.toString()));
        }
    }

    private String getFriendlyMessage(String responseCode) {
        if (responseCode == null) {
            return "Lỗi không xác định";
        }
        switch (responseCode) {
            case "00":
                return "Giao dịch thành công";
            case "07":
                return "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới gian lận, giao dịch bất thường).";
            case "09":
                return "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.";
            case "10":
                return "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.";
            case "11":
                return "Giao dịch đã quá thời gian chờ thanh toán. Quý khách vui lòng thực hiện lại giao dịch";
            case "12":
                return "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.";
            case "13":
                return "Giao dịch không thành công do: Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Quý khách vui lòng thực hiện lại giao dịch.";
            case "24":
                return "Giao dịch không thành công do: Khách hàng hủy giao dịch.";
            case "51":
                return "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.";
            case "65":
                return "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.";
            case "75":
                return "Ngân hàng thanh toán đang bảo trì.";
            case "99":
                return "Các lỗi khác (Lỗi phát sinh tại Giao diện thanh toán VNPay hoặc hệ thống Ngân hàng).";
            default:
                return "Giao dịch thất bại (Mã lỗi: " + responseCode + ")";
        }
    }

    @GetMapping("/vnpay/ipn")
    public ResponseEntity<Map<String, String>> vnpayIpn(HttpServletRequest request) {
        Map<String, String> fields = new HashMap<>();
        for (Map.Entry<String, String[]> entry : request.getParameterMap().entrySet()) {
            if (entry.getValue() != null && entry.getValue().length > 0) {
                fields.put(entry.getKey(), entry.getValue()[0]);
            }
        }

        Map<String, String> ipnResult = vnpayService.processPaymentIpn(fields);
        return ResponseEntity.ok(ipnResult);
    }
}
