<?php

namespace App\Http\Controllers;

use App\Modules\Docs\Models\Document;
use App\Modules\Invoice\Models\Invoice;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $canSeeInvoices = auth()->user()->isAdmin() || auth()->user()->levelFor('invoice') !== null;
        $canSeeDocs = auth()->user()->isAdmin() || auth()->user()->levelFor('docs') !== null;

        return Inertia::render('dashboard', [
            'stats' => [
                'documentCount' => $canSeeDocs ? Document::where('is_published', true)->count() : null,
                'invoiceCountThisMonth' => $canSeeInvoices
                    ? Invoice::whereMonth('issue_date', now()->month)->whereYear('issue_date', now()->year)->count()
                    : null,
                'invoiceTotalThisMonth' => $canSeeInvoices
                    ? (float) Invoice::whereMonth('issue_date', now()->month)->whereYear('issue_date', now()->year)->sum('total')
                    : null,
            ],
            'recentInvoices' => $canSeeInvoices
                ? Invoice::orderByDesc('sequence')->limit(5)->get(['id', 'number', 'client_name', 'issue_date', 'total'])
                : [],
        ]);
    }
}
