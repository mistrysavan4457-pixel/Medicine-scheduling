from django.db import models
from django.utils import timezone


class Patient(models.Model):
    full_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    password = models.CharField(max_length=128, default="password123")

    def __str__(self) -> str:
        return self.full_name


class Medicine(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="medicines"
    )

    medicine_name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=50)
    frequency = models.IntegerField()
    duration = models.IntegerField()
    refill_threshold = models.IntegerField(default=5)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.medicine_name


class Schedule(models.Model):
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="schedules"
    )

    reminder_time = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        default="Pending"
    )

    taken_at = models.DateTimeField(
        null=True,
        blank=True
    )

    def save(self, *args, **kwargs):
        is_taken = self.status == "Taken"
        if is_taken and not self.taken_at:
            self.taken_at = timezone.now()
        elif self.status != "Taken":
            self.taken_at = None
            
        super().save(*args, **kwargs)
        
        if is_taken:
            # Create/update adherence record for this medicine, patient, and date
            Adherence.objects.get_or_create(
                patient=self.medicine.patient,
                medicine=self.medicine,
                date=self.reminder_time.date(),
                defaults={'taken': True}
            )

    def __str__(self) -> str:
        return f"{self.medicine.medicine_name}"


class Adherence(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE
    )

    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE
    )

    taken = models.BooleanField(default=False)

    date = models.DateField(default=timezone.now)

    def __str__(self) -> str:
        return f"{self.patient.full_name}"


class Doctor(models.Model):
    full_name = models.CharField(max_length=100)
    specialty = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128, default="password123")

    def __str__(self) -> str:
        return self.full_name


class DoctorNotification(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    medicine_name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=50)
    frequency = models.IntegerField()
    duration = models.IntegerField()
    refill_threshold = models.IntegerField(default=5)
    
    status = models.CharField(
        max_length=20,
        default="Pending"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Notification from {self.doctor.full_name} to {self.patient.full_name}"