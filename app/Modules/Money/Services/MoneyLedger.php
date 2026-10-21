<?php

namespace App\Modules\Money\Services;

use App\Models\User;
use App\Modules\Money\Models\MoneyTransaction;
use App\Modules\Money\Models\MoneyWallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Writes that must stay consistent across two rows live here — currently
 * inter-wallet transfers, stored as a paired expense + income sharing one
 * transfer_id so the total balance never changes.
 */
class MoneyLedger
{
    /** @return array{0: MoneyTransaction, 1: MoneyTransaction} [outgoing, incoming] */
    public function transfer(User $actor, MoneyWallet $from, MoneyWallet $to, int $amount, string $date, ?string $note = null): array
    {
        return DB::transaction(function () use ($actor, $from, $to, $amount, $date, $note) {
            $transferId = (string) Str::uuid();
            $suffix = $note ? " — {$note}" : '';

            $outgoing = MoneyTransaction::create([
                'wallet_id' => $from->id,
                'type' => 'expense',
                'amount' => $amount,
                'date' => $date,
                'note' => "Transfer ke {$to->name}{$suffix}",
                'transfer_id' => $transferId,
                'created_by' => $actor->id,
            ]);

            $incoming = MoneyTransaction::create([
                'wallet_id' => $to->id,
                'type' => 'income',
                'amount' => $amount,
                'date' => $date,
                'note' => "Transfer dari {$from->name}{$suffix}",
                'transfer_id' => $transferId,
                'created_by' => $actor->id,
            ]);

            return [$outgoing, $incoming];
        });
    }
}
