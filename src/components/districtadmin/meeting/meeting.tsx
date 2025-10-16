"use client";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Copy, ExternalLink, Calendar, Users } from "lucide-react";

interface Meeting {
  meetingId: string;
  meetLink: string;
  courseId?: string;
  courseName: string;
  description: string;
  createdBy: string;
  createdAt: string;
  status: string;
}

export default function MeetCard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/districtadmin/meetings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch meetings');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setMeetings(data.meetings);
        } else {
          throw new Error(data.message || 'Failed to load meetings');
        }
      } catch (err) {
        console.error('Error fetching meetings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load meetings');
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const handleCreateClass = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/districtadmin/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: 'district-wide',
          courseName: 'District Meeting',
          description: 'District-wide meeting'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }

      const data = await response.json();
      
      if (data.success) {
        // Add the new meeting to the list
        setMeetings(prev => [data.meeting, ...prev]);
      } else {
        throw new Error(data.error || 'Failed to create meeting');
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const copyMeetLink = async (meetLink: string) => {
    try {
      await navigator.clipboard.writeText(meetLink);
      console.log('Meet link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const openMeetLink = (meetLink: string) => {
    window.open(meetLink, '_blank');
  };

  return (
    <div className="bg-white rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[18px] font-bold text-[var(--neutral-1000)]">Meet</div>
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          District Wide
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-md border animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : meetings.length > 0 ? (
        <div className="mt-6 space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
          {meetings.map((meeting) => (
            <div key={meeting.meetingId} className="p-3 bg-gray-50 rounded-md border hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                  {meeting.courseName}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => copyMeetLink(meeting.meetLink)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Copy link"
                  >
                    <Copy className="h-3 w-3 text-gray-500" />
                  </button>
                  <button
                    onClick={() => openMeetLink(meeting.meetLink)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Open meeting"
                  >
                    <ExternalLink className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-600 mb-2 truncate" title={meeting.meetLink}>
                {meeting.meetLink}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{new Date(meeting.createdAt).toLocaleDateString()}</span>
                <Users className="h-3 w-3 ml-2" />
                <span>{meeting.status}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 h-24 rounded-md bg-[var(--neutral-100)] grid place-items-center text-[var(--neutral-400)] text-sm">
          No class schedule
        </div>
      )}

      <Button 
        className="mt-6 w-full rounded-full" 
        size="lg"
        onClick={handleCreateClass}
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Meeting'}
      </Button>
    </div>
  );
}
