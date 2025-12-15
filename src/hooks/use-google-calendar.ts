import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type GoogleCalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
};

type EventData = {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  location?: string;
};

export const useTestGoogleCalendarConnection = () => {
  return useMutation({
    mutationFn: async (calendarId: string) => {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'test-connection', calendarId }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);
      
      return data;
    }
  });
};

export const useGoogleCalendarEvents = (
  calendarId: string | null | undefined,
  timeMin?: string,
  timeMax?: string
) => {
  return useQuery({
    queryKey: ['google-calendar-events', calendarId, timeMin, timeMax],
    queryFn: async () => {
      if (!calendarId) return [];

      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { 
          action: 'list-events', 
          calendarId,
          timeMin,
          timeMax
        }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);
      
      return data.events as GoogleCalendarEvent[];
    },
    enabled: !!calendarId
  });
};

export const useCreateGoogleCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ calendarId, eventData }: { calendarId: string; eventData: EventData }) => {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'create-event', calendarId, eventData }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);
      
      return data.event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['google-calendar-events'],
        refetchType: 'all'
      });
    }
  });
};

export const useUpdateGoogleCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      calendarId, 
      eventId, 
      eventData 
    }: { 
      calendarId: string; 
      eventId: string; 
      eventData: EventData 
    }) => {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'update-event', calendarId, eventId, eventData }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);
      
      return data.event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['google-calendar-events'],
        refetchType: 'all'
      });
    }
  });
};

export const useDeleteGoogleCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ calendarId, eventId }: { calendarId: string; eventId: string }) => {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'delete-event', calendarId, eventId }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['google-calendar-events'],
        refetchType: 'all'
      });
    }
  });
};
