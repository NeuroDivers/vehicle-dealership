# PowerShell script to fix LeadPipeline.tsx

$file = "src\app\admin\leads\LeadPipeline.tsx"
$content = Get-Content $file -Raw

# Add fetchLeadActivity function after fetchStaff
$fetchActivityFunction = @"

  const fetchLeadActivity = async (leadId: string) => {
    try {
      const response = await fetch(
        ``${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev'}/api/leads/${leadId}/activity``
      );
      if (response.ok) {
        const data = await response.json();
        const combined = [
          ...data.callLogs.map((log: any) => ({ ...log, type: 'call' })),
          ...data.notes.map((note: any) => ({ ...note, type: 'note' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setLeadNotes(combined);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    }
  };
"@

$content = $content -replace '(const fetchStaff[\s\S]*?};)', "`$1$fetchActivityFunction"

# Update logCall function
$oldLogCall = 'const logCall = async \(\) => \{[\s\S]*?(?=\n\n  const addNote)'
$newLogCall = @'
const logCall = async () => {
    if (!selectedLead) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev'}/api/call-logs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: selectedLead.id,
            staff_name: 'Current User',
            duration_minutes: parseInt(callDuration) || 0,
            notes: callNotes,
            outcome: callOutcome
          })
        }
      );
      
      if (response.ok) {
        setToast({ message: 'Call logged successfully!', type: 'success' });
        setShowCallModal(false);
        setCallDuration('');
        setCallNotes('');
        setCallOutcome('answered');
        
        if (selectedLead.status === 'new') {
          await updateLeadStatus(selectedLead.id, 'contacted');
        }
        
        await fetchLeadActivity(selectedLead.id);
      } else {
        setToast({ message: 'Failed to log call', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to log call:', error);
      setToast({ message: 'Failed to log call', type: 'error' });
    }
  };
'@

$content = $content -replace $oldLogCall, $newLogCall

# Update addNote function  
$oldAddNote = 'const addNote = \(\) => \{[\s\S]*?(?=\n\n  const handleDragStart)'
$newAddNote = @'
const addNote = async () => {
    if (!selectedLead || !newNote.trim()) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev'}/api/lead-notes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: selectedLead.id,
            staff_name: 'Current User',
            note_text: newNote,
            note_type: 'note'
          })
        }
      );
      
      if (response.ok) {
        setNewNote('');
        setToast({ message: 'Note added!', type: 'success' });
        await fetchLeadActivity(selectedLead.id);
      } else {
        setToast({ message: 'Failed to add note', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      setToast({ message: 'Failed to add note', type: 'error' });
    }
  };
'@

$content = $content -replace $oldAddNote, $newAddNote

# Add useEffect to fetch activity when lead is selected
$useEffectActivity = @"

  useEffect(() => {
    if (selectedLead && showLeadModal) {
      fetchLeadActivity(selectedLead.id);
    }
  }, [selectedLead, showLeadModal]);
"@

$content = $content -replace '(useEffect\(\) => \{\s+fetchLeads[\s\S]*?}, \[\]\);)', "`$1$useEffectActivity"

# Add Toast component at the end before closing div
$content = $content -replace '(\s+{/\* Call Log Modal \*/})', "`n`n      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}`$1"

# Save the file
$content | Set-Content $file -NoNewline

Write-Host "LeadPipeline.tsx has been updated successfully!" -ForegroundColor Green
