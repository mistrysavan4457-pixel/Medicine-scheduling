from rest_framework import generics
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView

from .models import (
    Patient,
    Medicine,
    Schedule,
    Adherence,
    Doctor,
    DoctorNotification
)

from .serializers import (
    PatientSerializer,
    MedicineSerializer,
    ScheduleSerializer,
    AdherenceSerializer,
    DoctorSerializer,
    DoctorNotificationSerializer
)


def create_schedules_for_medicine(medicine):
    from datetime import datetime, time, timedelta
    from django.utils import timezone
    from .models import Schedule
    
    base_date = timezone.now().date()
    
    if medicine.frequency == 1:
        times = [time(9, 0)]
    elif medicine.frequency == 2:
        times = [time(9, 0), time(21, 0)]
    elif medicine.frequency == 3:
        times = [time(9, 0), time(14, 0), time(21, 0)]
    elif medicine.frequency == 4:
        times = [time(8, 0), time(12, 0), time(16, 0), time(20, 0)]
    else:
        interval = 24 / medicine.frequency
        times = [time(int((8 + i * interval) % 24), 0) for i in range(medicine.frequency)]
        
    for day in range(medicine.duration):
        for t in times:
            reminder_datetime = timezone.make_aware(datetime.combine(base_date + timedelta(days=day), t))
            Schedule.objects.create(
                medicine=medicine,
                reminder_time=reminder_datetime,
                status="Pending"
            )


class PatientListCreateView(
    generics.ListCreateAPIView
):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer


class MedicineListCreateView(
    generics.ListCreateAPIView
):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer

    def perform_create(self, serializer):
        medicine = serializer.save()
        create_schedules_for_medicine(medicine)


class MedicineRetrieveUpdateDestroyAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer


class ScheduleListView(
    generics.ListAPIView
):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer


class ScheduleRetrieveUpdateDestroyAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer


class AdherenceListView(
    generics.ListCreateAPIView
):
    queryset = Adherence.objects.all()
    serializer_class = AdherenceSerializer


class ExtractMedicationView(APIView):

    def post(self, request):

        text = request.data.get("text", "")
        
        # Simple rule-based mock extractor that looks for keywords in the prompt text
        # If user pastes something like "Aspirin 100mg once a day for 10 days"
        text_lower = text.lower()
        
        medicine_name = "Paracetamol"
        dosage = "500mg"
        frequency = 2
        duration = 5
        
        # Try to find medicine name
        med_keywords = ["aspirin", "paracetamol", "ibuprofen", "amoxicillin", "lipitor", "metformin"]
        for med in med_keywords:
            if med in text_lower:
                medicine_name = med.capitalize()
                break
                
        # Try to find dosage
        import re
        dosage_match = re.search(r'\d+(?:mg|g|ml|mcg)', text_lower)
        if dosage_match:
            dosage = dosage_match.group(0)
            
        # Try to find frequency
        if "once" in text_lower or "one time" in text_lower or "1 time" in text_lower:
            frequency = 1
        elif "twice" in text_lower or "double" in text_lower or "2 times" in text_lower:
            frequency = 2
        elif "three" in text_lower or "thrice" in text_lower or "3 times" in text_lower:
            frequency = 3
        elif "four" in text_lower or "4 times" in text_lower:
            frequency = 4
            
        # Try to find duration
        duration_match = re.search(r'(\d+)\s*days', text_lower)
        if duration_match:
            duration = int(duration_match.group(1))
            
        result = {
            "medicine_name": medicine_name,
            "dosage": dosage,
            "frequency": frequency,
            "duration": duration
        }

        return Response(result)


class DoctorListCreateView(generics.ListCreateAPIView):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer


class DoctorNotificationListCreateView(generics.ListCreateAPIView):
    queryset = DoctorNotification.objects.all()
    serializer_class = DoctorNotificationSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        patient = instance.patient
        doctor = instance.doctor
        print(f"\n==================================================")
        print(f"[SMS GATEWAY] Sending notification to patient...")
        print(f"TO: {patient.full_name} ({patient.phone})")
        print(f"MESSAGE: Dr. {doctor.full_name} has sent you a new prescription for {instance.medicine_name} ({instance.dosage}, {instance.frequency}x/day for {instance.duration} days).")
        print(f"Please log in to your MedKeep dashboard to Accept & Schedule.")
        print(f"==================================================\n")


class DoctorNotificationRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DoctorNotification.objects.all()
    serializer_class = DoctorNotificationSerializer

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        if old_status != "Accepted" and instance.status == "Accepted":
            from .models import Medicine
            medicine = Medicine.objects.create(
                patient=instance.patient,
                medicine_name=instance.medicine_name,
                dosage=instance.dosage,
                frequency=instance.frequency,
                duration=instance.duration,
                refill_threshold=instance.refill_threshold
            )
            create_schedules_for_medicine(medicine)


class PatientRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer


class DoctorRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer