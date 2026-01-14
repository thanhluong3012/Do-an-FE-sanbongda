import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const timeSlots = [
  { time: "06:00", available: true },
  { time: "07:00", available: true },
  { time: "08:00", available: false },
  { time: "09:00", available: false },
  { time: "10:00", available: true },
  { time: "11:00", available: true },
  { time: "12:00", available: true },
  { time: "13:00", available: false },
  { time: "14:00", available: true },
  { time: "15:00", available: true },
  { time: "16:00", available: false },
  { time: "17:00", available: false },
  { time: "18:00", available: true },
  { time: "19:00", available: true },
  { time: "20:00", available: false },
  { time: "21:00", available: true },
];

const days = [
  { date: "08", day: "T2", isToday: true },
  { date: "09", day: "T3", isToday: false },
  { date: "10", day: "T4", isToday: false },
  { date: "11", day: "T5", isToday: false },
  { date: "12", day: "T6", isToday: false },
  { date: "13", day: "T7", isToday: false },
  { date: "14", day: "CN", isToday: false },
];

const BookingSection = () => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  return (
    <section id="booking" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Đặt lịch <span className="text-primary">nhanh chóng</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Chọn ngày và khung giờ phù hợp, xác nhận đặt sân chỉ trong vài bước
            đơn giản
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card variant="elevated">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="text-primary" size={24} />
                  Chọn thời gian
                </CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary" />
                    <span className="text-muted-foreground">Còn trống</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-muted" />
                    <span className="text-muted-foreground">Đã đặt</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Date Picker */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">
                    Tháng 1, 2026
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <ChevronLeft size={20} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <ChevronRight size={20} />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDay(index)}
                      className={`flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-200 ${
                        selectedDay === index
                          ? "bg-primary text-primary-foreground shadow-md"
                          : day.isToday
                          ? "bg-accent/20 text-accent hover:bg-accent/30"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      }`}
                    >
                      <span className="text-xs font-medium opacity-80">
                        {day.day}
                      </span>
                      <span className="text-xl font-bold">{day.date}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">
                  Chọn khung giờ
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() =>
                        slot.available && setSelectedSlot(slot.time)
                      }
                      disabled={!slot.available}
                      className={`relative py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        !slot.available
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : selectedSlot === slot.time
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      }`}
                    >
                      {slot.time}
                      {selectedSlot === slot.time && (
                        <Check
                          size={14}
                          className="absolute top-1 right-1"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Booking Summary */}
              {selectedSlot && (
                <div className="mt-8 p-4 bg-muted rounded-xl animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Thời gian đã chọn
                      </p>
                      <p className="font-semibold text-foreground">
                        {days[selectedDay].day}, {days[selectedDay].date}/01 -{" "}
                        {selectedSlot}
                      </p>
                    </div>
                    <Button variant="hero" size="lg">
                      Xác nhận đặt sân
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
