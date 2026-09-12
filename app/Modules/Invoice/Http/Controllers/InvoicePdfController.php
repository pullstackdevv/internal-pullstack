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
use League\CommonMark\CommonMarkConverter;

class InvoicePdfController extends Controller
{
    public function __invoke(Invoice $invoice, Settings $settings): Response
    {
        $converter = new CommonMarkConverter(['html_input' => 'strip']);

        $items = array_map(
            fn (array $item) => [...$item, 'description_html' => (string) $converter->convert($item['description'])],
            $invoice->items()
        );

        $qrResult = (new Builder(
            writer: new PngWriter(),
            data: $invoice->number,
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::Low,
            size: 160,
            margin: 0,
        ))->build();

        $qrDataUri = 'data:image/png;base64,'.base64_encode($qrResult->getString());
        $logoDataUri = 'data:image/png;base64,'.base64_encode(file_get_contents(public_path('pullstack.png')));

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'items' => $items,
            'issuer' => $settings->get('invoice.issuer', [
                'name' => 'Pullstack Dev', 'address' => '', 'phone' => '', 'email' => '',
            ]),
            'payment' => $settings->get('invoice.payment', [
                'account_name' => '', 'bank' => '', 'account_number' => '',
            ]),
            'qrDataUri' => $qrDataUri,
            'logoDataUri' => $logoDataUri,
        ]);

        $filename = str_replace('/', '-', $invoice->number).'.pdf';

        return $pdf->stream($filename);
    }
}
