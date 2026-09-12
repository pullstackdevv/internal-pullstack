<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 12px; color: #1a1a1a; }
        .header { display: table; width: 100%; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 20px; }
        .header .brand { display: table-cell; vertical-align: top; }
        .header .brand img { height: 40px; }
        .header .issuer { display: table-cell; text-align: right; vertical-align: top; }
        .issuer p { margin: 2px 0; color: #444; }
        h1.title { font-size: 28px; margin: 0 0 16px 0; }

        .meta { display: table; width: 100%; margin-bottom: 16px; }
        .meta .left, .meta .right { display: table-cell; width: 50%; vertical-align: top; }
        .meta .right { text-align: right; }
        .meta-block table { border-collapse: collapse; }
        .meta-block td { padding: 2px 0; }
        .meta-block td.label { color: #666; padding-right: 16px; white-space: nowrap; }

        .bill-to .label { color: #666; margin: 2px 0; }
        .bill-to .name { font-weight: bold; margin: 2px 0; }

        .rule { border-top: 2px solid #1a1a1a; margin: 16px 0; }

        table.items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.items th { background: #e5e5e5; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; }
        table.items th:last-child, table.items td:last-child { text-align: right; }
        table.items td { padding: 8px; border-bottom: 1px solid #eee; }
        table.items td.description p { margin: 0 0 4px 0; }
        table.items td.description p:last-child { margin-bottom: 0; }
        table.items td.description ul, table.items td.description ol { margin: 4px 0; padding-left: 16px; }
        table.items td.description li { margin-bottom: 2px; }
        .total-row td { background: #e5e5e5; font-weight: bold; padding: 10px 8px; text-transform: uppercase; font-size: 11px; }
        .total-row td:last-child { text-transform: none; font-size: 12px; }

        .payment { margin-top: 24px; border-top: 2px solid #1a1a1a; padding-top: 16px; }
        .payment-title { font-weight: bold; margin: 0 0 8px 0; }
        .payment table { border-collapse: collapse; margin-bottom: 16px; }
        .payment td { padding: 2px 0; }
        .payment td.label { color: #666; padding-right: 16px; white-space: nowrap; }
        .qr { text-align: left; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand"><img src="{{ $logoDataUri }}" alt="{{ $issuer['name'] }}"></div>
        <div class="issuer">
            <p>{{ $issuer['address'] }}</p>
            <p>{{ $issuer['email'] }} | {{ $issuer['phone'] }}</p>
        </div>
    </div>

    <h1 class="title">INVOICE</h1>

    <div class="meta">
        <div class="left meta-block">
            <table>
                <tr>
                    <td class="label">Invoice No.</td>
                    <td>{{ $invoice->number }}</td>
                </tr>
                <tr>
                    <td class="label">Invoice Date</td>
                    <td>{{ \Carbon\Carbon::parse($invoice->issue_date)->translatedFormat('d F Y') }}</td>
                </tr>
            </table>
        </div>
        <div class="right bill-to">
            <p class="label">BILL TO</p>
            <p class="name">{{ $invoice->client_name }}</p>
        </div>
    </div>

    <div class="rule"></div>

    <table class="items">
        <thead>
            <tr>
                <th>Description</th>
                <th>Service Period</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($items as $item)
                <tr>
                    <td class="description">{!! $item['description_html'] !!}</td>
                    <td>{{ $item['month'] ?: '-' }}</td>
                    <td>Rp{{ number_format($item['amount'], 0, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td></td>
                <td>Total Due</td>
                <td>Rp{{ number_format($invoice->total, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="payment">
        <p class="payment-title">Payment Information</p>
        <table>
            <tr>
                <td class="label">Account Name</td>
                <td>{{ $payment['account_name'] }}</td>
            </tr>
            <tr>
                <td class="label">Bank</td>
                <td>{{ $payment['bank'] }}</td>
            </tr>
            <tr>
                <td class="label">Account Number</td>
                <td>{{ $payment['account_number'] }}</td>
            </tr>
        </table>
        <div class="qr">
            <img src="{{ $qrDataUri }}" width="80" height="80">
        </div>
    </div>
</body>
</html>
