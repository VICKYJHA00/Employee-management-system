
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-400">Working Days (excl. holidays)</p>
                  <p className="text-2xl font-bold text-white">{liveAttendanceStats[0]?.workingDays || 0}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-400">Holidays This Month</p>
                  <p className="text-2xl font-bold text-orange-400">{holidays.length}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 cursor-pointer hover:border-blue-500/30" onClick={() => setShowSettingsDialog(true)}>
                  <p className="text-xs text-gray-400">Threshold</p>
                  <p className="text-2xl font-bold text-white">{minDaysThreshold} days</p>
                  <p className="text-xs text-blue-400">Click to edit</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-400">Avg Attendance %</p>
                  <p className="text-2xl font-bold text-green-400">
                    {liveAttendanceStats.length > 0 ? Math.round(liveAttendanceStats.reduce((s, a) => s + a.percentage, 0) / liveAttendanceStats.length) : 0}%
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by admin name or role..."
                  value={liveStatsSearch}
                  onChange={(e) => setLiveStatsSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10"
                />
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Working Days</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLiveStats.map((stat) => (
                      <TableRow key={stat.admin_id}>
                        <TableCell className="font-medium">{stat.name}</TableCell>
                        <TableCell className="text-gray-400">{stat.role?.replace('_', ' ')}</TableCell>
                        <TableCell className="text-blue-400">{stat.present}</TableCell>
                        <TableCell className="text-gray-400">{stat.late}</TableCell>
                        <TableCell className="text-red-400">{stat.absent}</TableCell>
                        <TableCell>{stat.workingDays}</TableCell>
                        <TableCell className="font-medium">{stat.score.toFixed(1)}</TableCell>
                        <TableCell>
                          <Badge variant={stat.percentage >= 80 ? "default" : stat.percentage >= 50 ? "secondary" : "destructive"}>
                            {stat.percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stat.status === 'active' ? "default" : "destructive"}>
                            {stat.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredLiveStats.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Page {liveStatsPage} of {liveStatsTotalPages} ({filteredLiveStats.length} admins)</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={liveStatsPage <= 1} onClick={() => setLiveStatsPage(p => p - 1)}>Previous</Button>
                    <Button size="sm" variant="outline" disabled={liveStatsPage >= liveStatsTotalPages} onClick={() => setLiveStatsPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Attendance Reviews (from Run Review) */}
      <Collapsible open={reviewsOpen} onOpenChange={setReviewsOpen}>
        <Card className="border-white/10">
          <CollapsibleTrigger asChild>
            <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-pointer hover:bg-white/5 transition-colors">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Formal Reviews — {currentMonthLabel}
                <Badge variant="outline" className="ml-2">{filteredReviews.length}</Badge>
                {suspendedReviews.length > 0 && <Badge variant="destructive" className="ml-1">{suspendedReviews.length} suspended</Badge>}
              </CardTitle>
              <div className="flex items-center gap-2">
                {reviewsOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap mb-4">
                <Button size="sm" variant="outline" onClick={() => setShowSettingsDialog(true)}>
                  <Settings className="w-4 h-4 mr-1" /> Settings
                </Button>
                <Button size="sm" variant="outline" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                </Button>
                <Button size="sm" onClick={triggerManualReview} disabled={triggeringReview}>
                  {triggeringReview ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                  Run Review
                </Button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by admin name or role..."
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10"
                />
              </div>

              {paginatedReviews.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Admin</TableHead>
                          <TableHead>Month</TableHead>
                          <TableHead>Present</TableHead>
                          <TableHead>Late</TableHead>
                          <TableHead>Absent</TableHead>
                          <TableHead>Working Days</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Suspension</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedReviews.map((review) => (
                          <TableRow key={review.id}>
                            <TableCell className="font-medium">{getAdminName(review.admin_id)}</TableCell>
                            <TableCell>{review.month}/{review.year}</TableCell>
                            <TableCell>{review.present_days}</TableCell>
                            <TableCell>{review.late_days}</TableCell>
                            <TableCell>{review.absent_days}</TableCell>
                            <TableCell>{review.total_working_days}</TableCell>
                            <TableCell>
                              <Badge variant={review.is_suspended ? "destructive" : "default"}>
                                {review.is_suspended ? 'Suspended' : 'OK'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-gray-400">
                              {review.suspension_start && review.suspension_end
                                ? `${review.suspension_start} → ${review.suspension_end}`
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {review.is_suspended && (
                                <Button size="sm" variant="outline" className="text-green-400 border-green-500/30 hover:bg-green-500/10" onClick={() => overrideSuspensionToActive(review.id, review.admin_id)}>
                                  <ShieldCheck className="w-3 h-3 mr-1" /> Activate
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredReviews.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">Page {reviewPage} of {reviewTotalPages} ({filteredReviews.length} items)</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={reviewPage <= 1} onClick={() => setReviewPage(p => p - 1)}>Previous</Button>
                        <Button size="sm" variant="outline" disabled={reviewPage >= reviewTotalPages} onClick={() => setReviewPage(p => p + 1)}>Next</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">
                  {reviewSearch ? 'No matching reviews found.' : `No formal reviews for ${currentMonthLabel}. Click "Run Review" to generate.`}
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Recent Work Logs - Collapsible Card */}
      <Collapsible open={workLogsOpen} onOpenChange={setWorkLogsOpen}>
        <Card className="border-white/10">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  Recent Work Logs — {currentMonthLabel}
                  <Badge variant="outline" className="ml-2">{allWorkLogs.length}</Badge>
                </span>
                {workLogsOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, title, type, status..."
                  value={workLogSearch}
                  onChange={(e) => setWorkLogSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10"
                />
              </div>

              {paginatedWorkLogs.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Admin</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedWorkLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">{getAdminName(log.admin_id)}</TableCell>
                            <TableCell><Badge variant="outline">{log.log_type}</Badge></TableCell>
                            <TableCell className="max-w-[200px] truncate">{log.title}</TableCell>
                            <TableCell><Badge variant="secondary">{log.status}</Badge></TableCell>
                            <TableCell className="text-xs text-gray-400">{new Date(log.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredWorkLogs.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">Page {workLogPage} of {workLogTotalPages} ({filteredWorkLogs.length} items)</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={workLogPage <= 1} onClick={() => setWorkLogPage(p => p - 1)}>Previous</Button>
                        <Button size="sm" variant="outline" disabled={workLogPage >= workLogTotalPages} onClick={() => setWorkLogPage(p => p + 1)}>Next</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">No work logs this month.</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default SuperAdminReviewPanel;
