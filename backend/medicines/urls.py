from django.urls import path

from .views import (
    PatientListCreateView,
    PatientRetrieveUpdateDestroyAPIView,
    MedicineListCreateView,
    MedicineRetrieveUpdateDestroyAPIView,
    ScheduleListView,
    ScheduleRetrieveUpdateDestroyAPIView,
    AdherenceListView,
    ExtractMedicationView,
    DoctorListCreateView,
    DoctorRetrieveUpdateDestroyAPIView,
    DoctorNotificationListCreateView,
    DoctorNotificationRetrieveUpdateDestroyAPIView
)

urlpatterns = [

    path(
        "patients/",
        PatientListCreateView.as_view()
    ),

    path(
        "patients/<int:pk>/",
        PatientRetrieveUpdateDestroyAPIView.as_view()
    ),

    path(
        "medicines/",
        MedicineListCreateView.as_view()
    ),

    path(
        "medicines/<int:pk>/",
        MedicineRetrieveUpdateDestroyAPIView.as_view()
    ),

    path(
        "schedules/",
        ScheduleListView.as_view()
    ),

    path(
        "schedules/<int:pk>/",
        ScheduleRetrieveUpdateDestroyAPIView.as_view()
    ),

    path(
        "adherence/",
        AdherenceListView.as_view()
    ),

    path(
        "extract-medication/",
        ExtractMedicationView.as_view()
    ),

    path(
        "doctors/",
        DoctorListCreateView.as_view()
    ),

    path(
        "doctors/<int:pk>/",
        DoctorRetrieveUpdateDestroyAPIView.as_view()
    ),

    path(
        "notifications/",
        DoctorNotificationListCreateView.as_view()
    ),

    path(
        "notifications/<int:pk>/",
        DoctorNotificationRetrieveUpdateDestroyAPIView.as_view()
    ),
]