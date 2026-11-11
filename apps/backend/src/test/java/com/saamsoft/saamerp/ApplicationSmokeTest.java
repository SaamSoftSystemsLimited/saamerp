package com.saamsoft.saamerp;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApplicationSmokeTest {
    @LocalServerPort int port;

    @Test
    void healthIsPublicButOtherRequestsAreDenied() throws Exception {
        var client = HttpClient.newHttpClient();
        var health = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/actuator/health")).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(health.statusCode()).isEqualTo(200);
        assertThat(health.body()).contains("UP").doesNotContain("components");
        var business = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/tenants")).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(business.statusCode()).isEqualTo(403);
    }
}
