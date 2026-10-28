package com.qlpk.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    public String uploadFile(MultipartFile multipartFile) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(multipartFile.getBytes(),
                ObjectUtils.asMap("folder", "phong_kham"));

        return uploadResult.get("secure_url").toString();
    }
}