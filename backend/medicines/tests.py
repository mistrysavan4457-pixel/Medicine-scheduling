from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Patient, Medicine, Schedule, Adherence


class MedicineReminderTests(APITestCase):

    def setUp(self):
        # Create a test patient
        self.patient = Patient.objects.create(
            full_name="Alice Smith",
            email="alice@example.com",
            phone="1234567890"
        )

    def test_create_patient(self):
        url = "/api/patients/"
        data = {
            "full_name": "Bob Johnson",
            "email": "bob@example.com",
            "phone": "0987654321"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Patient.objects.count(), 2)

    def test_medicine_creation_generates_schedules(self):
        url = "/api/medicines/"
        data = {
            "patient": self.patient.id,
            "medicine_name": "Ibuprofen",
            "dosage": "200mg",
            "frequency": 2, # 2 times a day
            "duration": 3,   # 3 days
            "refill_threshold": 2
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify medicine created
        self.assertEqual(Medicine.objects.count(), 1)
        medicine = Medicine.objects.first()
        self.assertEqual(medicine.medicine_name, "Ibuprofen")
        
        # Verify 2 frequency * 3 duration = 6 schedules generated
        self.assertEqual(Schedule.objects.count(), 6)
        
        # Verify all schedules are initially Pending
        pending_count = Schedule.objects.filter(status="Pending").count()
        self.assertEqual(pending_count, 6)

    def test_mark_schedule_taken_logs_adherence(self):
        # Create medicine manually
        medicine = Medicine.objects.create(
            patient=self.patient,
            medicine_name="Aspirin",
            dosage="100mg",
            frequency=1,
            duration=2
        )
        
        # Manually create schedules to test the view updates
        schedule = Schedule.objects.create(
            medicine=medicine,
            reminder_time=timezone.now(),
            status="Pending"
        )
        
        # Verify no adherence records exist
        self.assertEqual(Adherence.objects.count(), 0)
        
        url = f"/api/schedules/{schedule.id}/"
        data = {
            "status": "Taken"
        }
        
        # Mark schedule as Taken via patch
        response = self.client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify schedule is updated
        schedule.refresh_from_db()
        self.assertEqual(schedule.status, "Taken")
        self.assertIsNotNone(schedule.taken_at)
        
        # Verify adherence is logged automatically
        self.assertEqual(Adherence.objects.count(), 1)
        adherence = Adherence.objects.first()
        self.assertTrue(adherence.taken)
        self.assertEqual(adherence.patient, self.patient)
        self.assertEqual(adherence.medicine, medicine)
