from enum import Enum

class Role(str,Enum):
    organizer="organizer"
    attendee="attendee"