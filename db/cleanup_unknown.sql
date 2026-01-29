-- Clean up "Unknown" entries from Prozorro
-- This deletes opportunities with "Untitled Tender" title and NULL or "Unknown" agency

-- Delete related data using EXISTS for better SQLite compatibility
DELETE FROM shortlist 
WHERE EXISTS (
  SELECT 1 
  FROM opportunities 
  WHERE opportunities.opportunity_id = shortlist.opportunity_id 
    AND opportunities.source = shortlist.source
    AND opportunities.source = 'prozorro_ua' 
    AND opportunities.title = 'Untitled Tender' 
    AND (opportunities.agency IS NULL OR opportunities.agency LIKE '%Unknown%')
);

DELETE FROM analyses 
WHERE EXISTS (
  SELECT 1 
  FROM opportunities 
  WHERE opportunities.opportunity_id = analyses.opportunity_id 
    AND opportunities.source = analyses.source
    AND opportunities.source = 'prozorro_ua' 
    AND opportunities.title = 'Untitled Tender' 
    AND (opportunities.agency IS NULL OR opportunities.agency LIKE '%Unknown%')
);

DELETE FROM documents 
WHERE EXISTS (
  SELECT 1 
  FROM opportunities 
  WHERE opportunities.opportunity_id = documents.opportunity_id 
    AND opportunities.source = documents.source
    AND opportunities.source = 'prozorro_ua' 
    AND opportunities.title = 'Untitled Tender' 
    AND (opportunities.agency IS NULL OR opportunities.agency LIKE '%Unknown%')
);

DELETE FROM opportunity_versions 
WHERE EXISTS (
  SELECT 1 
  FROM opportunities 
  WHERE opportunities.opportunity_id = opportunity_versions.opportunity_id 
    AND opportunities.source = opportunity_versions.source
    AND opportunities.source = 'prozorro_ua' 
    AND opportunities.title = 'Untitled Tender' 
    AND (opportunities.agency IS NULL OR opportunities.agency LIKE '%Unknown%')
);

-- Finally, delete the opportunities
DELETE FROM opportunities 
WHERE source = 'prozorro_ua' 
  AND title = 'Untitled Tender' 
  AND (agency IS NULL OR agency LIKE '%Unknown%');
