from rest_framework import serializers

from .models import (
    Patient,
    Medicine,
    Schedule,
    Adherence,
    Doctor,
    DoctorNotification
)


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = "__all__"


class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = "__all__"


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = "__all__"


class AdherenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Adherence
        fields = "__all__"


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = "__all__"


class DoctorNotificationSerializer(serializers.ModelSerializer):
    doctor_name = serializers.ReadOnlyField(source="doctor.full_name")
    doctor_specialty = serializers.ReadOnlyField(source="doctor.specialty")
    patient_name = serializers.ReadOnlyField(source="patient.full_name")
    patient_phone = serializers.ReadOnlyField(source="patient.phone")

    class Meta:
        model = DoctorNotification
        fields = "__all__"