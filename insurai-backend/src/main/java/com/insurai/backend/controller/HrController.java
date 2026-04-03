package com.insurai.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurai.backend.entity.Benefit;
import com.insurai.backend.entity.Employee;
import com.insurai.backend.entity.Task;
import com.insurai.backend.entity.Verification;
import com.insurai.backend.service.AdminService;
import com.insurai.backend.service.BenefitService;
import com.insurai.backend.service.EmployeeService;
import com.insurai.backend.service.HrService;
import com.insurai.backend.service.TaskService;
import com.insurai.backend.service.VerificationService;

@RestController
@RequestMapping("/api/hr")
public class HrController {

    private final HrService hrService;
    private final AdminService adminService;
    private final EmployeeService employeeService;
    private final BenefitService benefitService;
    private final VerificationService verificationService;
    private final TaskService taskService;

    public HrController(HrService hrService, AdminService adminService,
                        EmployeeService employeeService, BenefitService benefitService,
                        VerificationService verificationService, TaskService taskService) {
        this.hrService = hrService;
        this.adminService = adminService;
        this.employeeService = employeeService;
        this.benefitService = benefitService;
        this.verificationService = verificationService;
        this.taskService = taskService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getHrDashboard() {
        Map<String, Object> data = hrService.getHrDashboardData();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/claims/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentClaims() {
        List<Map<String, Object>> claims = hrService.getRecentClaims(5);
        return ResponseEntity.ok(claims);
    }


    @GetMapping("/verifications/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingVerifications() {
        List<Map<String, Object>> pending = hrService.getPendingVerifications(5);
        return ResponseEntity.ok(pending);
    }

    @PutMapping("/claims/{claimId}/approve")
    public ResponseEntity<Map<String, Object>> approveClaim(@PathVariable Long claimId) {
        Map<String, Object> result = adminService.approveClaim(claimId);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/claims/{claimId}/reject")
    public ResponseEntity<Map<String, Object>> rejectClaim(@PathVariable Long claimId) {
        Map<String, Object> result = adminService.rejectClaim(claimId);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/verifications/{verificationId}/approve")
    public ResponseEntity<Verification> approveVerification(@PathVariable Long verificationId) {
        return ResponseEntity.ok(verificationService.approveVerification(verificationId));
    }

    @PutMapping("/verifications/{verificationId}/reject")
    public ResponseEntity<Verification> rejectVerification(@PathVariable Long verificationId) {
        return ResponseEntity.ok(verificationService.rejectVerification(verificationId));
    }

    @GetMapping("/employees")
    public ResponseEntity<List<Employee>> getEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @PostMapping("/employees")
    public ResponseEntity<Employee> createEmployee(@RequestBody Employee employee) {
        return ResponseEntity.ok(employeeService.saveEmployee(employee));
    }

    @DeleteMapping("/employees/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/benefits")
    public ResponseEntity<List<Benefit>> getBenefits() {
        return ResponseEntity.ok(benefitService.getAllBenefits());
    }

    @PostMapping("/benefits")
    public ResponseEntity<Benefit> createBenefit(@RequestBody Benefit benefit) {
        return ResponseEntity.ok(benefitService.saveBenefit(benefit));
    }

    @GetMapping("/verifications")
    public ResponseEntity<List<Verification>> getVerifications() {
return ResponseEntity.ok(
    verificationService.getAllVerifications(PageRequest.of(0, 50)).getContent()
);    }

    @GetMapping("/verifications-with-documents")
    public ResponseEntity<List<Map<String, Object>>> getVerificationsWithDocuments() {
        return ResponseEntity.ok(hrService.getVerificationsWithDocuments(50));
    }

    @PostMapping("/verifications")
    public ResponseEntity<Verification> createVerification(@RequestBody Verification verification) {
        return ResponseEntity.ok(verificationService.saveVerification(verification));
    }

    @PostMapping("/add-benefit")
    public ResponseEntity<Benefit> addBenefit(@RequestBody Benefit benefit) {
        return ResponseEntity.ok(benefitService.saveBenefit(benefit));
    }

    @PostMapping("/benefits/{benefitId}/assign")
    public ResponseEntity<Benefit> assignBenefit(@PathVariable Long benefitId, @RequestBody Map<String, String> request) {
        String userEmail = request.get("userEmail");
        return ResponseEntity.ok(benefitService.assignBenefit(benefitId, userEmail));
    }

    @PostMapping("/verify-user")
    public ResponseEntity<Verification> verifyUser(@RequestBody Map<String, Object> verificationData) {
        // Create verification for user
        Verification verification = new Verification();
        verification.setEmployeeName((String) verificationData.get("userEmail"));
        verification.setDocumentType("USER_VERIFICATION");
        verification.setStatus("VERIFIED");
        return ResponseEntity.ok(verificationService.saveVerification(verification));
    }

    @PostMapping("/verify-claim")
    public ResponseEntity<Verification> verifyClaim(@RequestBody Map<String, Object> verificationData) {
        // Create verification for claim
        Verification verification = new Verification();
        verification.setEmployeeName((String) verificationData.get("userEmail"));
        verification.setDocumentType("CLAIM_VERIFICATION");
        verification.setStatus("VERIFIED");
        return ResponseEntity.ok(verificationService.saveVerification(verification));
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<Task>> getTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @PostMapping("/tasks")
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        return ResponseEntity.ok(taskService.saveTask(task));
    }
}
