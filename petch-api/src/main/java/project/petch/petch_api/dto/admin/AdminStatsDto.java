package project.petch.petch_api.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminStatsDto {
    private long totalUsers;
    private long totalPets;
    private long totalAdoptedPets;
    private long totalAdopters;
    private long totalVendors;
    private long pendingReports;
}
