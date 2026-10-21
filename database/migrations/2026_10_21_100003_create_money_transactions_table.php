<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('money_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained('money_wallets');
            $table->foreignId('category_id')->nullable()->constrained('money_categories')->nullOnDelete();
            $table->string('type'); // income|expense
            $table->unsignedBigInteger('amount');
            $table->date('date');
            $table->string('note')->nullable();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->uuid('transfer_id')->nullable()->index();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index('date');
            $table->index('wallet_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('money_transactions');
    }
};
