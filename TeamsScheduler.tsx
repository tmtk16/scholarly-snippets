import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TeamsSchedulerProps {
  submissionId?: number;
  defaultDate?: Date;
  isConsultation?: boolean;
}

// Available time slots
const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM"
];

// Meeting durations
const DURATIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" }
];

// Available time zones
const TIME_ZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" }
];

export default function TeamsScheduler({ submissionId, defaultDate, isConsultation = false }: TeamsSchedulerProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(defaultDate || new Date());
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [duration, setDuration] = useState<string>(isConsultation ? "45" : "30");
  const [topic, setTopic] = useState<string>(submissionId ? `Discussion about submission #${submissionId}` : "");
  const [description, setDescription] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("");
  const [consultationNeeds, setConsultationNeeds] = useState<string>("");
  
  // Get user's time zone on component mount
  useEffect(() => {
    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(userTimeZone);
    } catch (e) {
      // Default to ET if browser doesn't support time zone detection
      setTimezone("America/New_York");
    }
  }, []);
  
  // Filter out past dates
  const isDateDisabled = (date: Date) => {
    return date < new Date(new Date().setHours(0, 0, 0, 0));
  };
  
  // Filter out time slots that have already passed for today
  const getAvailableTimeSlots = () => {
    if (!date) return TIME_SLOTS;
    
    const isToday = new Date().toDateString() === date.toDateString();
    if (!isToday) return TIME_SLOTS;
    
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    
    return TIME_SLOTS.filter(slot => {
      const [hourStr, minuteStr, period] = slot.match(/(\d+):(\d+)\s(AM|PM)/)?.slice(1) || [];
      if (!hourStr || !minuteStr || !period) return false;
      
      let hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      
      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;
      
      return hour > currentHour || (hour === currentHour && minute > currentMinute);
    });
  };
  
  // Handle form submission to create a Teams meeting
  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (!date || !timeSlot || !duration || !timezone) {
        throw new Error("Please select a date, time, duration, and time zone");
      }
      
      if (isConsultation && !consultationNeeds.trim()) {
        throw new Error("Please describe what you need help with in your consultation");
      }
      
      // Parse time slot to get hours and minutes
      const [hourStr, minuteStr, period] = timeSlot.match(/(\d+):(\d+)\s(AM|PM)/)?.slice(1) || [];
      if (!hourStr || !minuteStr || !period) {
        throw new Error("Invalid time format");
      }
      
      let hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      
      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;
      
      // Create start and end date objects
      const startDate = new Date(date);
      startDate.setHours(hour, minute, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMinutes(startDate.getMinutes() + parseInt(duration));
      
      // Prepare the description with consultation needs if relevant
      const fullDescription = isConsultation 
        ? `Consultation Needs: ${consultationNeeds}\n\n${description}` 
        : description;
      
      return apiRequest("POST", "/api/meetings/teams", {
        topic,
        description: fullDescription,
        submissionId,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        timezone
      });
    },
    onSuccess: () => {
      toast({
        title: "Meeting requested",
        description: "Your Microsoft Teams meeting request has been submitted. You'll receive a confirmation email once it's scheduled.",
      });
      
      // Reset form
      setTimeSlot("");
      setDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to schedule meeting",
        description: error.message || "An error occurred while scheduling your meeting. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const availableTimeSlots = getAvailableTimeSlots();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Schedule a Microsoft Teams Meeting</CardTitle>
        <CardDescription>
          Choose a date and time for your consultation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
          <div className="flex-1">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={isDateDisabled}
              className="rounded-md border"
            />
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="time-slot">Select Time</Label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger id="time-slot">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No available times
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select time zone" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_ZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topic">Meeting Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter meeting topic"
              />
            </div>
            
            {isConsultation && (
              <div className="space-y-2">
                <Label htmlFor="consultationNeeds">
                  What do you need help with? <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="consultationNeeds"
                  value={consultationNeeds}
                  onChange={(e) => setConsultationNeeds(e.target.value)}
                  placeholder="Describe your writing challenges or questions"
                  className="min-h-[80px]"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="description">Additional Notes (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what you'd like to discuss"
                className="min-h-[80px]"
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => scheduleMutation.mutate()}
          disabled={
            !date || 
            !timeSlot || 
            !duration || 
            !topic || 
            !timezone || 
            (isConsultation && !consultationNeeds.trim()) || 
            scheduleMutation.isPending
          }
        >
          {scheduleMutation.isPending ? "Scheduling..." : "Schedule Teams Meeting"}
        </Button>
      </CardFooter>
    </Card>
  );
}