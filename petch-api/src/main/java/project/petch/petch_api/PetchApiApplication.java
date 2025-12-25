package project.petch.petch_api;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PetchApiApplication {

	public static void main(String[] args) {
		// Load .env file and set environment variables
		Dotenv dotenv = Dotenv.configure()
				.ignoreIfMissing() // Don't fail if .env is missing (e.g., in production)
				.load();

		// Set environment variables from .env file
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

		SpringApplication.run(PetchApiApplication.class, args);
	}

}
