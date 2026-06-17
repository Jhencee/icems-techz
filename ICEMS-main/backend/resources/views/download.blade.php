<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Download ICEMS App</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .card {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(122,31,43,0.12);
            padding: 48px 40px;
            max-width: 420px;
            width: 90%;
            text-align: center;
        }

        .logo-wrap {
            background: #7a1f2b;
            width: 80px;
            height: 80px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }

        .logo-wrap svg {
            width: 44px;
            height: 44px;
            fill: #fff;
        }

        h1 {
            font-size: 1.6rem;
            color: #7a1f2b;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .subtitle {
            color: #666;
            font-size: 0.95rem;
            margin-bottom: 32px;
            line-height: 1.5;
        }

        .version-badge {
            display: inline-block;
            background: #f0e6e8;
            color: #7a1f2b;
            font-size: 0.78rem;
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 20px;
            margin-bottom: 28px;
        }

        .download-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: #7a1f2b;
            color: #fff;
            text-decoration: none;
            padding: 16px 28px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            transition: background 0.2s, transform 0.15s;
            margin-bottom: 12px;
        }

        .download-btn:hover {
            background: #5e1720;
            transform: translateY(-2px);
        }

        .download-btn svg {
            width: 22px;
            height: 22px;
            fill: #fff;
        }

        .file-info {
            color: #999;
            font-size: 0.8rem;
            margin-bottom: 32px;
        }

        .divider {
            border: none;
            border-top: 1px solid #eee;
            margin: 24px 0;
        }

        .ios-note {
            background: #fff8e1;
            border: 1px solid #ffe082;
            border-radius: 10px;
            padding: 14px 16px;
            text-align: left;
        }

        .ios-note p {
            font-size: 0.82rem;
            color: #795548;
            line-height: 1.6;
        }

        .ios-note strong {
            display: block;
            margin-bottom: 4px;
            color: #5d4037;
        }

        .steps {
            list-style: none;
            margin-top: 24px;
            text-align: left;
        }

        .steps li {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 14px;
            font-size: 0.88rem;
            color: #444;
        }

        .step-num {
            background: #7a1f2b;
            color: #fff;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
            flex-shrink: 0;
            margin-top: 1px;
        }

        footer {
            margin-top: 32px;
            font-size: 0.75rem;
            color: #bbb;
        }
    </style>
</head>
<body>

<div class="card">
    <!-- Logo -->
    <div class="logo-wrap">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A8 8 0 0 1 4.07 11H5a1 1 0 0 1 0 2 6 6 0 0 0 6 6zm0-4V7a1 1 0 0 1 2 0v5.93A8 8 0 0 1 19.93 11H19a1 1 0 0 1 0-2 6 6 0 0 0-6-6z"/>
        </svg>
    </div>

    <h1>ICEMS Mobile App</h1>
    <p class="subtitle">
        Integrated Clearance and Event Management System<br>
        for PUP Santa Maria Campus
    </p>

    <span class="version-badge">Android APK &bull; v1.0.0</span>

    <!-- Download Button -->
    <a href="{{ asset('downloads/ICEMS.apk') }}" class="download-btn" download>
        <svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.84v4h5.66V9h3.84L12 2z"/></svg>
        Download for Android
    </a>

    <p class="file-info">APK file &bull; Compatible with Android 6.0+</p>

    <!-- Install Steps -->
    <ul class="steps">
        <li>
            <span class="step-num">1</span>
            <span>Tap <strong>Download for Android</strong> above to get the APK file.</span>
        </li>
        <li>
            <span class="step-num">2</span>
            <span>Open your <strong>Downloads</strong> folder and tap the file.</span>
        </li>
        <li>
            <span class="step-num">3</span>
            <span>If prompted, allow <strong>Install from Unknown Sources</strong> in your settings.</span>
        </li>
        <li>
            <span class="step-num">4</span>
            <span>Tap <strong>Install</strong> and wait for it to finish.</span>
        </li>
    </ul>

    <hr class="divider">

    <!-- iOS Note -->
    <div class="ios-note">
        <p>
            <strong>📱 iOS / iPhone Users</strong>
            The ICEMS app is currently available for Android only.
            iOS support is coming soon.
        </p>
    </div>

    <footer>
        &copy; {{ date('Y') }} PUP Santa Maria Campus &bull; ICEMS
    </footer>
</div>

</body>
</html>
