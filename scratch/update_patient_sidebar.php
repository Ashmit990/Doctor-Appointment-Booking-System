<?php
$pages = [
    'homepage.html' => 'Home',
    'dashboard.html' => 'My Appointments',
    'profile.html' => 'Profile'
];

$dir = 'c:\\xampp\\htdocs\\Doctor-Appointment-Booking-System\\pages\\patient';

foreach ($pages as $file => $activeBtn) {
    $filePath = "$dir\\$file";
    $content = file_get_contents($filePath);

    // Extract everything before the first button and after the last button within the aside
    if (preg_match('/(<aside[^>]*>[\s\S]*?<\/div>)([\s\S]*?)(<\/aside>)/i', $content, $matches)) {
        
        $asideStart = $matches[1]; // Includes the logo div
        $asideEnd = $matches[3];

        $btnClsInactive = 'w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/15 hover:bg-white/25 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 shadow-sm';
        $btnClsActive = 'w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white shadow-md flex flex-col items-center justify-center gap-1.5';

        $iconColorsActive = 'text-teal-700';
        $iconColorsInactive = 'text-white';
        
        $textActive = 'text-teal-700 font-bold';
        $textInactive = 'text-white font-medium';

        $buttons = [
            [
                'name' => 'Home',
                'action' => 'onclick="goToHomePage()"',
                'icon' => 'house',
                'text' => 'Home'
            ],
            [
                'name' => 'Appointments',
                'action' => 'onclick="goToDashboard()"',
                'icon' => 'calendar-days',
                'text' => 'Appointments'
            ],
            [
                'name' => 'Profile',
                'action' => 'onclick="goToProfile()"',
                'icon' => 'user',
                'text' => 'Profile'
            ]
        ];

        $newButtonsHtml = "\n";
        foreach ($buttons as $btn) {
            $isActive = ($btn['name'] === $activeBtn);
            
            $cls = $isActive ? $btnClsActive : $btnClsInactive;
            $iconColor = $isActive ? $iconColorsActive : $iconColorsInactive;
            $textColor = $isActive ? $textActive : $textInactive;
            
            // For active tab, remove onclick action if it exists, or keep it depending on original design. Let's keep or omit action.
            $action = $isActive ? '' : $btn['action'];

            $newButtonsHtml .= "      <button $action class=\"$cls\" title=\"{$btn['name']}\">\n";
            $newButtonsHtml .= "        <i data-lucide=\"{$btn['icon']}\" class=\"w-6 h-6 md:w-7 md:h-7 $iconColor\"></i>\n";
            $newButtonsHtml .= "        <span class=\"$textColor text-[10px] md:text-sm text-center leading-tight\">{$btn['text']}</span>\n";
            $newButtonsHtml .= "      </button>\n\n";
        }

        // Logout button
        $newButtonsHtml .= "      <div class=\"mt-auto mb-4 w-full flex justify-center\">\n";
        $newButtonsHtml .= "        <button type=\"button\" onclick=\"logoutPatient()\" class=\"w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/15 hover:bg-white/25 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 shadow-sm\" title=\"Logout\">\n";
        $newButtonsHtml .= "          <i data-lucide=\"log-out\" class=\"w-6 h-6 md:w-7 md:h-7 text-white\"></i>\n";
        $newButtonsHtml .= "          <span class=\"text-white font-medium text-[10px] md:text-sm text-center\">Logout</span>\n";
        $newButtonsHtml .= "        </button>\n";
        $newButtonsHtml .= "      </div>\n";

        // To make gap-10 better for flex-col, let's also update the aside classes
        // Replace 'gap-10' with 'gap-6' in $asideStart
        $asideStart = str_replace('gap-10', 'gap-4', $asideStart);

        $newContent = str_replace($matches[0], $asideStart . $newButtonsHtml . "    " . $asideEnd, $content);
        
        file_put_contents($filePath, $newContent);
        echo "Updated $file\n";
    }
}
?>
