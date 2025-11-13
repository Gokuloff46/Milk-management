@extends('layouts.app')
@section('content')
<div class="container">
    <div class="card">
        <div class="card-body">
            <h1 class="card-title">Admin Dashboard</h1>
            <p>Welcome, {{ Auth::user()->name }}!</p>
        </div>
    </div>
</div>
@endsection