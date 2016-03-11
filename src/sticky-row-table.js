(function (window, $, undefined) {

  /**
   * Lock
   *
   * @constructor
   */
  function Lock() {
    this.locked = false;
  }

  Lock.prototype = {
    /**
     * Sets lock
     *
     * @returns {boolean}
     */
    lock: function () {
      if (this.locked) {
        return false;
      }
      this.locked = true;
      return true;
    },

    /**
     * Releases lock
     *
     * @returns {boolean}
     */
    release: function () {
      if (this.locked) {
        this.locked = false;
      }
      return true;
    }
  };


  /**
   * BodyContainer
   *
   * @constructor
   */
  function BodyContainer() {
    this.$window = $(window);
  }

  BodyContainer.prototype = {
    /**
     * Returns offset of body
     *
     * @returns {{top: number, left: number}}
     */
    getOffset: function () {
      return {top: 0, left: 0};
    },

    /**
     * Returns scroll positions of document
     *
     * @returns {{left: number, top: number}}
     */
    getScroll: function () {
      return {
        left: this.$window.scrollLeft(),
        top: this.$window.scrollTop()
      };
    },

    /**
     * Returns width of window
     *
     * @returns {number}
     */
    outerWidth: function () {
      return this.$window.outerWidth();
    }
  };


  /**
   * StickyRowTable
   *
   * @param element
   * @constructor
   */
  function StickyRowTable(element) {
    this._lock = new Lock();

    this.container = {
      $element: new BodyContainer()
    };
    this.table = {
      $element: $(element)
    };
    this.scroll = {
      vertical: false,
      horizontal: false
    };

    this.setRowSets();

    this.container.$element.$window
      .on("scroll", $.proxy(this.redraw, this))
      .on("resize", $.proxy(this.calculateDimensions, this));

    this.calculateDimensions();
    this.redraw(true);
  }

  StickyRowTable.prototype = {
    /**
     * Sets sticky rows
     *
     * @private
     */
    setRowSets: function () {
      var self = this;
      self.rowSets = [[], []];
      self.stickyNow = [];

      this.table.$element.find("tr").each(function (i, tr) {
        var dataset = $(tr).data();

        if (!dataset.hasOwnProperty("sticky")) {
          return;
        }

        if (dataset.hasOwnProperty("heading") || !self.rowSets[0].length) {
          self.rowSets[0].push({
            $row: $(tr)
          });
        } else {
          self.rowSets[1].push({
            $row: $(tr)
          });
        }
      });
      this.rowSets[0] = this.rowSets[0].reverse();
      this.rowSets[1] = this.rowSets[1].reverse();
    },

    /**
     * Redraws the sticky table
     *
     * Handling by scroll event (see constructor)
     *
     * @lockable
     * @param isForceRedraw
     */
    redraw: function (isForceRedraw) {
      if (!this._lock.lock()) {
        return;
      }

      this.scroll.vertical = false;
      this.scroll.horizontal = false;

      var containerScroll = this.container.$element.getScroll();

      if (containerScroll.top != this.container.scroll.top || isForceRedraw) {
        this.scroll.vertical = containerScroll.top > this.container.scroll.top ? "down" : "up";
        this.container.scroll.top = containerScroll.top;

        if (this.table.offset.top - this.container.offset.top > containerScroll.top ||
          this.table.offset.top - this.container.offset.top + this.table.height < containerScroll.top
        ) {
          if (!this.stickyTable.$element.is(":hidden")) {
            this.stickyTable.rows = [];
            this.stickyTable.$element.hide();
            this.stickyTable.$element.empty();
          }
        } else {
          this.renderStickyRows(this.searchCurrentStickyRows());
        }

      }

      this._lock.release();
    },

    /**
     * Calculates dimensions of the sticky table
     *
     * Handling by resize event (see constructor)
     *
     * @lockable
     */
    calculateDimensions: function () {
      if (!this._lock.lock()) {
        return;
      }

      // container
      this.container.offset = this.container.$element.getOffset();
      this.container.scroll = this.container.$element.getScroll();
      this.container.width = this.container.$element.outerWidth();

      // table
      this.table.width = this.table.$element.outerWidth();
      this.table.height = this.table.$element.height();
      this.table.offset = this.table.$element.offset();


      if (!this.stickyTable) {
        var stickyTable = $('<table/>');

        stickyTable.attr('class', this.table.$element.attr('class')).css({
          'position': 'fixed',
          'z-index': 1,
          'overflow': 'hidden',
          'background': '#fff',
          'display': 'none',
          'top': this.container.offset.top,
          'left': this.table.offset.left + this.container.scroll.left,
          'width': this.table.$element.width()
        }).insertBefore(this.table.$element);

        this.stickyTable = {
          $element: stickyTable,
          height: 0
        };
      } else {
        this.stickyTable.$element.css({
          'top': this.container.offset.top,
          'left': this.table.offset.left + this.container.scroll.left,
          'width': this.table.$element.width()
        });
      }

      this._lock.release();
    },

    /**
     * Searches stickied rows
     *
     * @returns {Array}
     */
    searchCurrentStickyRows: function () {
      var stickyNow = [];
      var stickyRow = this.getStickyRow(this.rowSets[0], this.container.scroll.top);

      if (stickyRow) {
        stickyNow.push(stickyRow);

        stickyRow = this.getStickyRow(this.rowSets[1], this.container.scroll.top + stickyRow.height, stickyRow);

        if (stickyRow) {
          stickyNow.push(stickyRow);
        }
      }

      return stickyNow;
    },

    /**
     *
     * @param stickyRows
     */
    renderStickyRows: function (stickyRows) {
      this.stickyTable.$element.empty();

      if (!stickyRows.length) {
        this.stickyTable.$element.hide();
        return;
      }

      var self = this;

      $.each(stickyRows, function (i, row) {
        self.stickyTable.$element.append(self.getCloneOfRow(row.row));
      });

      this.stickyTable.$element.css({
        'top': this.container.offset.top,
        'left': this.table.offset.left + this.container.scroll.left,
        'width': this.table.$element.width()
      });

      if (this.stickyTable.$element.is(':hidden')) {
        this.stickyTable.$element.show();
      }
    },

    /**
     *
     * @param rowSets
     * @param upperBound
     * @param headerRow
     * @returns {*}
     */
    getStickyRow: function (rowSets, upperBound, headerRow) {
      var stickied = [];

      $.each(rowSets, function (i, row) {
        var height = row.$row.outerHeight();
        var offset = row.$row.offset();
        var topOffset = offset.top - upperBound;

        if (topOffset <= 0) {
          if (headerRow && headerRow.topOffset >= topOffset) {
            return;
          }

          stickied.push({
            row: row,
            height: height,
            topOffset: topOffset
          });
        }
      });

      return stickied.length ? stickied.shift() : null;
    },

    /**
     * Clones row of the table
     *
     * @param rowObj
     * @returns {*}
     */
    getCloneOfRow: function (rowObj) {
      var $rowCloneTd;

      if (!rowObj.$clone) {
        rowObj.$clone = rowObj.$row.clone();
        $rowCloneTd = rowObj.$clone.children();

        $.each(rowObj.$row.children(), function (i, cell) {
          $rowCloneTd.eq(i).css({
            'width': $(cell).innerWidth()
          });
        });
      }
      return rowObj.$clone;
    }
  };


  /**
   * jQuery function
   */
  $.fn.stickyRowTable = function () {
    this.each(function () {
      if (!$.data(this, "stickyRowTable")) {
        $.data(this, "stickyRowTable", new StickyRowTable(this));
      }
    });
  }

})(window, jQuery);