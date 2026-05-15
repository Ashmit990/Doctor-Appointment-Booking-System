<?php
$dir = 'pages/admin/';
$files = glob($dir . '*.html');

foreach ($files as $file) {
    $content = file_get_contents($file);
    
    // Pattern to match the treatment_tickets.html link block
    // It usually looks like:
    // <a href="treatment_tickets.html" ...>...</a>
    // We want to remove the whole <a> tag and its content.
    
    // Example:
    // <a href="treatment_tickets.html" class="...">
    //   <svg ...>...</svg>Treatment Tickets
    // </a>
    
    $newContent = preg_replace('/<a\s+href="treatment_tickets\.html"[^>]*>.*?<\/a>/is', '', $content);
    
    if ($newContent !== $content) {
        file_put_contents($file, $newContent);
        echo "Cleaned $file\n";
    }
}
?>
