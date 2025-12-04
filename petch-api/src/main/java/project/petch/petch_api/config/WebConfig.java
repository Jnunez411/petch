package project.petch.petch_api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads/images}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry){
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        String uploadPathString = uploadPath.toUri().toString();
        registry.addResourceHandler("/uploads/images/**").addResourceLocations(uploadPathString);
    }
}
