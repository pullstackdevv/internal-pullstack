<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 12px; color: #1a1a1a; }
        .header { display: table; width: 100%; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
        .header .brand { display: table-cell; vertical-align: top; }
        .header .brand img { height: 40px; }
        .header .issuer { display: table-cell; text-align: right; vertical-align: top; }
        .issuer p { margin: 2px 0; color: #444; }
        h1.title { font-size: 28px; margin: 0 0 16px 0; }
        .meta { display: table; width: 100%; margin-bottom: 20px; }
        .meta .left, .meta .right { display: table-cell; width: 50%; vertical-align: top; }
        .meta .right { text-align: right; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.items th { background: #e5e5e5; text-align: left; padding: 8px; font-size: 12px; }
        table.items th:last-child, table.items td:last-child { text-align: right; }
        table.items td { padding: 8px; border-bottom: 1px solid #eee; }
        table.items td.description p { margin: 0 0 4px 0; }
        table.items td.description p:last-child { margin-bottom: 0; }
        table.items td.description ul, table.items td.description ol { margin: 4px 0; padding-left: 16px; }
        table.items td.description li { margin-bottom: 2px; }
        .total-row td { background: #e5e5e5; font-weight: bold; padding: 10px 8px; }
        .payment { margin-top: 24px; border-top: 2px solid #1a1a1a; padding-top: 16px; }
        .payment p { margin: 2px 0; }
        .qr { margin-top: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand"><img src="{{ $logoDataUri }}" alt="{{ $issuer['name'] }}"></div>
        <div class="issuer">
            <p>{{ $issuer['address'] }}</p>
            <p>No : {{ $issuer['phone'] }}</p>
            <p>Email : {{ $issuer['email'] }}</p>
        </div>
    </div>

    <h1 class="title">INVOICE</h1>

    <div class="meta">
        <div class="left">
            <p><strong>Invoice No</strong> &nbsp; {{ $invoice->number }}</p>
            <p><strong>Date</strong> &nbsp; {{ \Carbon\Carbon::parse($invoice->issue_date)->translatedFormat('d F Y') }}</p>
        </div>
        <div class="right">
            <p><strong>To</strong> &nbsp; {{ $invoice->client_name }}</p>
        </div>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>Job Description</th>
                <th>Month</th>
                <th>Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($items as $item)
                <tr>
                    <td class="description">{!! $item['description_html'] !!}</td>
                    <td>{{ $item['month'] ?: '-' }}</td>
                    <td>{{ number_format($item['amount'], 0, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td></td>
                <td>Total</td>
                <td>{{ number_format($invoice->total, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="payment">
        <p><strong>Payment Information</strong></p>
        <p>{{ $payment['account_name'] }}</p>
        <p>Bank Account : {{ $payment['account_number'] }} ({{ $payment['bank'] }})</p>
        <div class="qr">
            <img src="{{ $qrDataUri }}" width="80" height="80">
        </div>
    </div>
</body>
</html>
