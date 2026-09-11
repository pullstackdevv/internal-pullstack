<?php

namespace App\Modules\Invoice\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Invoice\Models\Invoice;
use App\Support\Settings\Settings;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\Response;

class InvoicePdfController extends Controller
{
    public function __invoke(Invoice $invoice, Settings $settings): Response
    {
        $qrResult = (new Builder(
            writer: new PngWriter(),
            data: $invoice->number,
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::Low,
            size: 160,
            margin: 0,
        ))->build();

        $qrDataUri = 'data:image/png;base64,'.base64_encode($qrResult->getString());

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'issuer' => $settings->get('invoice.issuer', [
                'name' => 'Pullstack Dev', 'address' => '', 'phone' => '', 'email' => '',
            ]),
            'payment' => $settings->get('invoice.payment', [
                'account_name' => '', 'bank' => '', 'account_number' => '',
            ]),
            'qrDataUri' => $qrDataUri,
        ]);

        $filename = str_replace('/', '-', $invoice->number).'.pdf';

        return $pdf->stream($filename);
    }
}
